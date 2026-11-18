# RIGAURA — Smart Wearable Safety Ring

A simple, pink-themed responsive web app prototype based on the RIGAURA hackathon presentation.

## Included features
- Five-tap SOS simulation (5 taps within 3 seconds).
- Trusted contacts list (up to 6, stored in browser local storage).
- GPS location lookup and Google Maps link.
- SMS alert draft for trusted contacts.
- Manual 30-second camera/microphone recording test.
- Password-protected cancellation for the local demo.
- Nearby police station search link and India 112 call shortcut.

## Run locally
1. Download or clone this repository.
2. Open `index.html` in a browser for the basic interface.
3. For GPS, camera/microphone, and browser permissions, serve it from localhost or HTTPS. For example:
   ```bash
   python -m http.server 8000
   ```
4. Visit `http://localhost:8000`.

## Important prototype limitations
This is a demonstration front end, not a production emergency response system. The SOS trigger is currently the on-screen button, not a real Bluetooth ring. SMS is opened as a draft and is not sent automatically. Recording requires the user to grant browser permissions and start it. The password is stored locally for demonstration and is not secure authentication. Live background tracking, automatic emergency messaging, BLE hardware integration, verified police data, and direct 112 integration require further Android and hardware development.

**In a real emergency, contact emergency services directly.**