# WhatsApp Online Status Bug — TODO / Fix Report

## Root cause

1. `index.js` mein `markOnlineOnConnect: true` tha. Isse linked WhatsApp socket connect hote hi account ko online announce karta tha.
2. Disconnect, PM2/Railway shutdown, dashboard stop, Telegram `/clearsession`, `xshutdown`, aur `xrestart` flows mein presence clear karne ka shared cleanup nahi tha.
3. Old socket ke delayed `connection.update` events nayi socket ko overwrite/reconnect kar sakte the, jis se stale online state aur duplicate connections ka risk tha.
4. Baileys keepalive option typo tha: `keepTHUGveIntervalMs`; ise `keepAliveIntervalMs` kiya gaya hai.

## Implemented fixes

- `markOnlineOnConnect` ko `false` kiya gaya.
- `BotSession.stop()` add kiya gaya: active interval clear karta hai, `unavailable` presence best-effort bhejta hai, socket close karta hai, connection status broadcast karta hai, aur optional session removal karta hai.
- `SIGTERM`/`SIGINT` graceful shutdown add kiya gaya, taaki PM2, Docker, Railway ya Ctrl+C par sockets close hon.
- Disconnect par active interval aur socket reference clean kiye jaate hain.
- Reconnect timers `isStopping` check karte hain, isliye intentional stop ke baad bot chupke se reconnect nahi karega.
- `connectionGeneration` guard add kiya gaya, taaki purani socket ke events current socket ko affect na karein.
- Dashboard stop, Telegram `/clearsession`, `xshutdown`, aur `xrestart` ko shared cleanup helper par migrate kiya gaya.

## Important WhatsApp limitation

Phone ka mobile data off karne se server par chal raha linked bot automatically band nahi hota. Agar bot ka server/socket connected hai, WhatsApp account online dikh sakta hai — yeh linked-device behavior hai. Phone se offline karne ke liye bot ko dashboard se stop karna, `/clearsession` chalana, ya hosting process ko stop karna hoga.

`markOnlineOnConnect: false` automatic online announcement ko rokta hai, lekin bot connected rehne par WhatsApp kabhi-kabhi activity/presence ko apne protocol ke mutabiq update kar sakta hai. 100% offline ke liye socket disconnect zaroori hai.

## Manual test checklist

- [ ] Bot start karke WhatsApp ke Linked Devices mein verify karein.
- [ ] Dashboard se **Stop Bot** karein; 30–120 seconds ke andar doosre account se online status check karein.
- [ ] Phone ka data off karke bot server ko chalne dein; expected result: bot connected rahega, isliye account online ho sakta hai.
- [ ] Hosting process stop/restart karein; graceful shutdown logs mein `Closing WhatsApp sessions...` aana chahiye.
- [ ] Bot ko dobara start karke ensure karein ki old socket duplicate reconnect nahi karta.
- [ ] `xrestart` ke baad ek hi active socket aur expected reconnect hona chahiye.

## Validation

- Sabhi JavaScript files `node --check` se pass.
- Old `markOnlineOnConnect: true` aur misspelled keepalive option remove ho chuke hain.

## Changed files

- `index.js`
- `commands/xshutdown.js`
- `commands/xrestart.js`
- `ONLINE_STATUS_TODO.md`
