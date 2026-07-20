# audio/

Ovde idu zvučni efekti za uvodnu scenu, ako se budu snimali.

Očekivana imena:

- `unlock.mp3` — otključavanje vozila
- `engine-start.mp3` — paljenje motora
- `click.mp3` — pritisak papučice

Zvuk nije obavezan. Podrazumevano se svi efekti sintetizuju preko Web Audio
API-ja, pa nijedan fajl nije potreban i nema zahteva ka serveru.

Kad fajlovi postoje, u `main.js` postavi:

```js
var Zvuk = {
  koristiFajlove: true,   // podrazumevano false
  ...
};
```
