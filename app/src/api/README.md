# Data layer

The app talks to data through `src/state/AppContext.tsx`.

Current implementation:

- `src/db/database.ts` creates and reads a local SQLite database.
- `src/db/seed.ts` is inserted into SQLite only on the first launch.
- Screens call context actions instead of mutating local arrays or hardcoded screen data.
- Actions persist changes in SQLite and then reload normalized `AppData`.

Local tables:

- `users`
- `memberships`
- `fitness_classes`
- `visits`
- `trainer_clients`
- `trainers`
- `halls`
- `workout_plans`
- `workout_exercises`
- `progress_data`
- `tariffs`
- `chats`
- `chat_messages`
- `app_meta`

Future 1C integration:

- Keep UI screens unchanged.
- Add a backend/1C adapter next to the SQLite repository.
- Either sync SQLite with the backend or replace local reads with remote reads when online.
- Map `AppData` from 1C catalogs/documents:
  - `User`, roles and card number from client/staff profile.
  - `Membership` from active subscription document.
  - `FitnessClass` from schedule/session documents.
  - `Visit` from check-in/access-control register.
  - `TrainerClient`, `Chat`, `ChatMessage` from trainer assignments and messages.

Recommended endpoints:

- `GET /mobile/bootstrap?phone=...`
- `POST /mobile/classes/{id}/book`
- `POST /mobile/classes/{id}/cancel`
- `POST /mobile/checkins`
- `POST /mobile/membership/freeze`
- `POST /mobile/membership/renew`
- `POST /mobile/chats/{id}/messages`

The current context already centralizes writes, so the real integration can be added without rewriting screens.
