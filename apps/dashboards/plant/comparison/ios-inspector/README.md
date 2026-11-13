# Recording on an iPhone through Safari's Web Inspector

`record.mjs` records the plant dashboard's own **Record 10 s** panel in Safari on an iPhone over USB, with no one at the phone. It drives Safari through its remote Web Inspector via [`ios-webkit-debug-proxy`](https://github.com/google/ios-webkit-debug-proxy). Results: [`../phone/iphone-x-safari16/`](../phone/iphone-x-safari16/README.md).

## Setup (Linux or WSL)

1. On the iPhone: Settings → Safari → Advanced → **Web Inspector** on. Set Auto-Lock to Never for the session, and keep Safari in front on an unlocked screen; the inspector only answers while Safari is in the foreground.
2. `sudo apt install usbmuxd libimobiledevice-utils`, plug in the phone and tap **Trust**. `idevicepair validate` should succeed.
   - Under WSL, pass the phone through with `usbipd attach --wsl --busid <id> --auto-attach`, and run `sudo usbmuxd -f -v -U root`, because WSL doesn't apply the USB permission rule to a device that's already attached.
3. `ios-webkit-debug-proxy` isn't packaged in Ubuntu 22.04/24.04 or Debian. Build v1.9.3 from source (`./autogen.sh && ./configure --disable-shared && make`), then run `ios_webkit_debug_proxy -c <udid>:9222`. `curl localhost:9222/json` should list Safari's tab.

## Run

```bash
node record.mjs --rounds 2 --out ../phone/<device>
# --only 1,6  --wait 25  --ws ws://localhost:9222/devtools/page/1
```

It opens the same 11 pages as the hand-recorded phones (5 builds at 1 and 5 kHz, then `own` at 5 kHz once), waits `--wait` seconds, presses Record, and saves the panel's JSON per page. Pages replace each other by navigation; Safari is never closed or force-quit.

- **Protocol:** commands go through `Target.sendMessageToTarget`, following `Target.didCommitProvisionalTarget` across navigation. A plain `Runtime.evaluate` on the page socket answers "'Runtime' domain was not found".
- **Typing is synthetic.** The inspector has no trusted-input domain on iOS, so the script dispatches a `keydown` plus an `input` event on the *Type here* box every 100 ms during the recording (`isTrusted: false`). The page times each event from its dispatch to the next frame. The typing figures therefore include main-thread queueing after dispatch, but not the OS input path, and aren't directly comparable with the hand-typed phone runs.
