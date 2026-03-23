# TripDone API Contract
> Agreed Day 1. Do not rename fields without telling each other.

## POST /api/search
Request: { from_city, to_city, date, modes[], adults }
Response: { routes[], flights[], trains[], taxi[], buses[], meta }

## GET /api/predict
Params: ?route=LKO-BOM&mode=flight&date=2026-03-19
Response: { verdict, confidence, reason, current_price, avg_14day, price_history[] }

## POST /api/alerts
Request: { route, mode, current_price, min_saving, travel_date, notify_via[], phone, email }
Response: { alert_id, status }

## POST /api/trips
Request: { route_id, selected_legs[], total_cost, delay_alert_enabled, travel_date }
Response: { trip_id, status }

## POST /api/chat
Request: { message, context, history[] }
Response: { reply }

## POST /api/gallery/upload-url
Request: { trip_id, filename, location }
Response: { upload_url, signature, public_id }

## Full JSON shapes: see shared Google Doc (link TBD)
