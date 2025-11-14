# EcoLogiTrack - End-to-End Testing Guide

This document provides a checklist and test cases to manually verify the core functionalities of the EcoLogiTrack application.

---

## 1. User Authentication

### 1.1. User Registration

*   **Objective:** Ensure a new user can register for an account.

*   **Manual Testing Steps:**
    1.  Navigate to the registration page (`/register`).
    2.  Fill in the registration form with a unique email, a password, name, and select a role (e.g., "Farmer").
    3.  Submit the form.
    4.  **Expected Outcome:** You should see a "Registration successful" message and be redirected to the login page.

*   **Sample API Test (using `curl` or a tool like Postman):**
    *   **Endpoint:** `POST /api/auth/register`
    *   **Payload:**
        ```json
        {
          "email": "test.farmer@example.com",
          "password": "securepassword123",
          "name": "Test Farmer",
          "role": "farmer"
        }
        ```
    *   **Expected Outcome:** A `201 Created` status with a success message.

---

### 1.2. User Login

*   **Objective:** Ensure a registered user can log in and receive an authentication token.

*   **Manual Testing Steps:**
    1.  Navigate to the login page (`/login`).
    2.  Enter the email and password of a registered user.
    3.  Submit the form.
    4.  **Expected Outcome:** You should be redirected to the dashboard corresponding to your user role.

*   **Sample API Test:**
    *   **Endpoint:** `POST /api/auth/login`
    *   **Payload:**
        ```json
        {
          "email": "test.farmer@example.com",
          "password": "securepassword123"
        }
        ```
    *   **Expected Outcome:** A `200 OK` status with an `access_token` and user details in the response body.

---

## 2. Role-Based Dashboards

*   **Objective:** Verify that the correct dashboard is displayed based on the logged-in user's role.

*   **Manual Testing Steps:**
    1.  Register and log in as a **Farmer**.
        *   **Expected Outcome:** You see the Farmer Dashboard, which should include options to upload production data.
    2.  Log out.
    3.  Register and log in as a **Distributor**.
        *   **Expected Outcome:** You see the Distributor Dashboard, which should show active deliveries, route optimization, and available production.
    4.  Log out.
    5.  Register and log in as a **Retailer**.
        *   **Expected Outcome:** You see the Retailer Dashboard, which should allow submitting demand and viewing order history.

---

## 3. AI Demand Prediction (Retailer/Admin)

*   **Objective:** Verify that the AI model can predict future demand.

*   **Manual Testing Steps (as a Retailer/Admin):**
    1.  Navigate to the section for demand prediction on the dashboard.
    2.  Select a future date and a region.
    3.  Click the "Predict Demand" button.
    4.  **Expected Outcome:** A chart or value should appear displaying the predicted demand in litres for the selected date.

*   **Sample API Test:**
    *   **Endpoint:** `POST /api/predict-demand`
    *   **Headers:** `Authorization: Bearer <your_access_token>`
    *   **Payload:**
        ```json
        {
          "date": "2025-12-25",
          "region": "ludhiana"
        }
        ```
    *   **Expected Outcome:** A `200 OK` status with a JSON object containing the predicted demand (e.g., `[{ "name": "2025-12-25", "demand": 1350.75 }]`).

---

## 4. Route Optimization (Distributor)

*   **Objective:** Verify that the system can calculate an optimized route based on selected cities and demands.

*   **Manual Testing Steps (as a Distributor):**
    1.  On the Distributor Dashboard, go to the "Route Optimization" section.
    2.  The map should display various cities. Click on a few cities to select them for a route (e.g., Amritsar, Jalandhar). A depot (Ludhiana) is usually pre-selected.
    3.  Adjust the "demand" value for each selected city.
    4.  Set the "Number of Vehicles".
    5.  Click the "Optimize Route" button.
    6.  **Expected Outcome:**
        *   The map should draw colored lines representing the optimized paths for each vehicle.
        *   A summary section should appear below the map, detailing the total distance, total CO₂ emissions, and the specific route for each vehicle.

*   **Sample API Test:**
    *   **Endpoint:** `POST /api/optimize`
    *   **Headers:** `Authorization: Bearer <your_access_token>`
    *   **Payload:**
        ```json
        {
          "locations": ["depot", "amritsar", "jalandhar"],
          "demands": [0, 300, 250],
          "num_vehicles": 1
        }
        ```
    *   **Expected Outcome:** A `200 OK` status with a detailed JSON response containing `routes`, `total_distance`, and `total_co2`.

---

## 5. Carbon Tracking & Sustainability Score (Distributor)

*   **Objective:** Verify that CO₂ emissions and a "Sustainability Score" are calculated and displayed after route optimization.

*   **Manual Testing Steps (as a Distributor):**
    1.  Follow the steps for **Route Optimization** above.
    2.  After the optimized route is displayed, look for the "Sustainability Score" component.
    3.  **Expected Outcome:** A card should display:
        *   The estimated CO₂ emissions in kg.
        *   A color-coded score (Green for low, Yellow for moderate, Red for high emissions).
        *   A qualitative message like "Excellent", "Moderate", or "High".

*   **Sample API Test:**
    *   **This is a two-step test.** First, get a distance from the `/api/optimize` endpoint. Then, use that distance to test the `/api/carbon-footprint` endpoint.
    *   **Step 1:** Call `/api/optimize` as described above and note the `total_distance`. Let's assume it returned `250` km.
    *   **Step 2:**
        *   **Endpoint:** `GET /api/carbon-footprint?distance=250&fuel_type=diesel`
        *   **Payload:** (None for GET request)
        *   **Expected Outcome:** A `200 OK` status with the calculated emissions.
            ```json
            {
              "distance_km": 250,
              "fuel_type": "diesel",
              "co2_emissions_kg": 95.71
            }
            ```
---
