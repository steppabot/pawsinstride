import os
import json
from flask import Flask, request, redirect, render_template, jsonify, abort, url_for
from dotenv import load_dotenv
import stripe

from db import (
    init_db,
    create_customer,
    create_dog,
    create_subscription,
    recommend_plan,
    update_subscription_status_by_customer,
    update_subscription_status_by_subscription_id,
    update_subscription_ids_by_customer,
)

load_dotenv()

app = Flask(__name__)

# ---------- Config ----------
STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")

# Stripe subscription/payment links for each plan
STRIPE_SMALL_PLAN_URL = os.getenv("STRIPE_SMALL_PLAN_URL")
STRIPE_MEDIUM_PLAN_URL = os.getenv("STRIPE_MEDIUM_PLAN_URL")
STRIPE_LARGE_PLAN_URL = os.getenv("STRIPE_LARGE_PLAN_URL")
STRIPE_XL_PLAN_URL = os.getenv("STRIPE_XL_PLAN_URL")

stripe.api_key = STRIPE_SECRET_KEY

# ---------- Startup ----------
init_db()


# ---------- Helpers ----------
def get_plan_checkout_url(plan_name: str) -> str:
    mapping = {
        "Small Plan": STRIPE_SMALL_PLAN_URL,
        "Medium Plan": STRIPE_MEDIUM_PLAN_URL,
        "Large Plan": STRIPE_LARGE_PLAN_URL,
        "XL Plan": STRIPE_XL_PLAN_URL,
    }
    url = mapping.get(plan_name)
    if not url:
        raise ValueError(f"No Stripe link configured for plan: {plan_name}")
    return url


def parse_allergies(form) -> list[str]:
    """
    Supports either:
    - allergies=Chicken&allergies=Rice
    - allergies[]=
    """
    allergies = form.getlist("allergies")
    if not allergies:
        allergies = form.getlist("allergies[]")
    return allergies


# ---------- Routes ----------
@app.route("/")
def home():
    return render_template("survey.html")


@app.route("/survey", methods=["GET"])
def survey():
    return render_template("survey.html")


@app.route("/recommend", methods=["POST"])
def recommend():
    """
    Step 1:
    User submits:
    - weight_range
    - activity_level
    - allergies[]
    """
    weight_range = request.form.get("weight_range", "").strip()
    activity_level = request.form.get("activity_level", "").strip()
    allergies = parse_allergies(request.form)

    if not weight_range or not activity_level:
        return abort(400, "Missing required survey fields.")

    recommended_plan, daily_ounces, weekly_price = recommend_plan(weight_range)

    return render_template(
    "owner_form.html",
    weight_range=weight_range,
    activity_level=activity_level,
    allergies=allergies,
    recommended_plan=recommended_plan,
    daily_ounces=daily_ounces,
    weekly_price=weekly_price,
)


@app.route("/start-subscription", methods=["POST"])
def start_subscription():
    """
    Step 2:
    User submits owner + dog info after seeing recommendation.
    We:
    - save customer
    - save dog
    - create pending subscription row
    - redirect to correct Stripe payment link
    """
    # Owner fields
    first_name = request.form.get("first_name", "").strip()
    last_name = request.form.get("last_name", "").strip()
    email = request.form.get("email", "").strip().lower()
    phone = request.form.get("phone", "").strip()
    delivery_address = request.form.get("delivery_address", "").strip()
    city = request.form.get("city", "").strip()
    state = request.form.get("state", "").strip()
    zipcode = request.form.get("zipcode", "").strip()

    # Dog fields
    dog_name = request.form.get("dog_name", "").strip()
    breed = request.form.get("breed", "").strip() or None
    age_raw = request.form.get("age_years", "").strip()
    age_years = int(age_raw) if age_raw else None

    weight_range = request.form.get("weight_range", "").strip()
    activity_level = request.form.get("activity_level", "").strip()
    allergies = parse_allergies(request.form)

    # Recompute plan server-side so user can't tamper with hidden fields
    recommended_plan, daily_ounces, weekly_price = recommend_plan(weight_range)

    required_fields = [
        first_name, last_name, email, phone,
        delivery_address, city, state, zipcode,
        dog_name, weight_range, activity_level
    ]
    if not all(required_fields):
        return abort(400, "Missing required fields.")

    # Save to DB
    customer_id = create_customer(
        first_name=first_name,
        last_name=last_name,
        email=email,
        phone=phone,
        address=delivery_address,
        city=city,
        state=state,
        zipcode=zipcode,
    )

    dog_id = create_dog(
        customer_id=customer_id,
        dog_name=dog_name,
        breed=breed,
        age_years=age_years,
        weight_range=weight_range,
        activity_level=activity_level,
        allergies=allergies,
        recommended_plan=recommended_plan,
        daily_ounces=daily_ounces,
    )

    create_subscription(
        customer_id=customer_id,
        dog_id=dog_id,
        subscription_status="pending",
    )

    # Redirect to the matching Stripe link
    checkout_url = get_plan_checkout_url(recommended_plan)

    # Optional: you can append query params for your own tracking
    # but Stripe Payment Links won't automatically write them into subscription metadata.
    return redirect(checkout_url, code=303)


@app.route("/success")
def success():
    return render_template("success.html")


@app.route("/cancel")
def cancel():
    return render_template("cancel.html")


@app.route("/health")
def health():
    return jsonify({"ok": True})


# ---------- Stripe Webhook ----------
@app.route("/stripe/webhook", methods=["POST"])
def stripe_webhook():
    payload = request.get_data(as_text=False)
    sig_header = request.headers.get("Stripe-Signature")

    if not STRIPE_WEBHOOK_SECRET:
        return abort(500, "Missing STRIPE_WEBHOOK_SECRET")

    try:
        event = stripe.Webhook.construct_event(
            payload=payload,
            sig_header=sig_header,
            secret=STRIPE_WEBHOOK_SECRET
        )
    except ValueError:
        return abort(400, "Invalid payload")
    except stripe.error.SignatureVerificationError:
        return abort(400, "Invalid signature")

    event_type = event["type"]
    data_object = event["data"]["object"]

    # 1) Payment Link / Checkout completed
    if event_type == "checkout.session.completed":
        customer_email = data_object.get("customer_details", {}).get("email")
        stripe_customer_id = data_object.get("customer")
        stripe_subscription_id = data_object.get("subscription")
        stripe_checkout_session_id = data_object.get("id")

        if customer_email:
            update_subscription_ids_by_customer(
                email=customer_email,
                stripe_customer_id=stripe_customer_id,
                stripe_subscription_id=stripe_subscription_id,
                stripe_checkout_session_id=stripe_checkout_session_id,
                subscription_status="active",
            )

    # 2) Subscription created
    elif event_type == "customer.subscription.created":
        stripe_subscription_id = data_object.get("id")
        stripe_customer_id = data_object.get("customer")
        status = data_object.get("status", "active")

        update_subscription_status_by_customer(
            stripe_customer_id=stripe_customer_id,
            subscription_status=status,
            stripe_subscription_id=stripe_subscription_id,
        )

    # 3) Subscription updated
    elif event_type == "customer.subscription.updated":
        stripe_subscription_id = data_object.get("id")
        status = data_object.get("status", "active")

        update_subscription_status_by_subscription_id(
            stripe_subscription_id=stripe_subscription_id,
            subscription_status=status,
        )

    # 4) Subscription canceled / deleted
    elif event_type == "customer.subscription.deleted":
        stripe_subscription_id = data_object.get("id")

        update_subscription_status_by_subscription_id(
            stripe_subscription_id=stripe_subscription_id,
            subscription_status="canceled",
        )

    return jsonify({"received": True})


if __name__ == "__main__":
    port = int(os.getenv("PORT", "5000"))
    app.run(host="0.0.0.0", port=port, debug=True)
