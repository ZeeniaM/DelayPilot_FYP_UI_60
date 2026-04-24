# DelayPilot System Overview

## What Is DelayPilot?

DelayPilot is an AI-powered decision support platform built for flight operations at Munich Airport. Its purpose is to spot likely delays before they fully unfold, explain the most likely reasons behind them, and help airport teams coordinate a response early. In simple terms, it helps operations teams move from reacting to delays after they happen to managing them proactively while there is still time to act.

## Who Uses It?

### Admin

Admins manage access to the system. They create and remove user accounts, activate or deactivate users, review account deletion requests, and check system activity logs.

### APOC (Airport Operations Center)

APOC users are the main operational users of DelayPilot. They monitor all flights at Munich Airport, review delay predictions and likely causes, run what-if simulations, create and manage mitigation cases, and coordinate with other teams through the tracker board.

### AOC (Airline Operations Control)

AOC users work much like APOC users, but only for their own airline. They see the same types of predictions, alerts, simulations, and mitigation cases, but only for flights linked to their airline. Each AOC account is tied to one specific airline.

### ATC (Air Traffic Control)

ATC users have a read-only view. They can monitor predictions, alerts, and mitigation activity so they stay informed, but they cannot create or change cases.

### Passenger

Passengers use a public-facing page without logging in. They can choose their flight and quickly see whether a delay is likely, how serious it may be, and a simple explanation of the most likely cause.

## Key Features

### Operations Dashboard

The dashboard gives a live picture of the current flight situation at Munich Airport. It highlights the number of flights in the system, how many are on time, how many are delayed, and the average delay. It also shows delay trends, cause patterns, and live weather conditions for Munich, Frankfurt, and London Heathrow so teams can understand the bigger operational picture at a glance.

### Flights Table

The flights table is the detailed operational view of every tracked flight. Users can search, filter, and open any flight to see more detail, including likely causes, timing, and possible knock-on effects on connected flights. This gives staff a single place to inspect both the headline situation and the detail behind it.

### Delay Cause Attribution

DelayPilot does more than say that a flight may be late. It also points to the most likely reason, such as weather, congestion, or a delay carried over from an earlier flight rotation. This helps teams understand what kind of response is most appropriate instead of treating all delays the same way.

### Flight Delay Simulation Tool

The simulation tool lets APOC and AOC users test "what-if" scenarios before making decisions. They can adjust weather conditions, previous aircraft delay, and airport traffic levels to see how the delay risk changes. This supports planning by showing what could happen under worse or better operating conditions.

### Mitigation Tracker Board

The mitigation board is a shared tracker for delay response work. Cases move through four stages, from first notice to resolution, so teams can see what is being handled and what still needs attention. Each case keeps the flight details, tagged causes, deadline, and a running team discussion in one place.

### Role-Based Alert System

When DelayPilot sees a significant delay risk, it raises an alert through the notification area. Users can dismiss alerts or turn them directly into mitigation cases. For airline users, those alerts are limited to their own airline so they only see what matters to them.

### Passenger View (Public Portal)

Passengers can use a simple public portal to check a flight without logging in. They choose a flight and receive a clear prediction summary, including likely delay status, estimated impact, and a plain-language explanation. The goal is to make prediction results understandable even for non-technical users.

### User Management (Admin)

Admins manage the people who can use DelayPilot. They can create new accounts, edit user details, assign roles, activate or deactivate accounts, and remove users when needed. They also handle account deletion requests submitted by users.

## AOC Airline Scoping

AOC users automatically see only the flights and mitigation cases for their own airline. This applies across the dashboard, flights table, mitigation board, simulation tools, and alerts. The design keeps each airline team focused on the information that is relevant to them, while APOC and ATC continue to see the full airport-wide view.

## Real-Time Collaboration

The mitigation case chat updates in real time. When one team member posts a message, other users viewing the same case see it appear straight away without refreshing the page. Users can reply to specific messages, react with emojis, and remove their own messages, which keeps coordination visible and traceable inside the case itself.

## Data and Predictions

DelayPilot connects to a separate data pipeline that regularly collects live flight and weather information, runs machine learning models, and prepares updated delay predictions for the system. These predictions are refreshed automatically every 30 minutes. The results are based on patterns from past operations together with current weather, airport traffic, and aircraft rotation history, helping teams understand not only whether a delay is likely but also why it may happen.
