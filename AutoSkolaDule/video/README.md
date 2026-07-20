# video/

Ovde ide snimak za uvodnu scenu, ako se bude snimao.

Očekivano ime: `intro.mp4` (i opciono `intro.webm` za manju veličinu).

Snimak nije obavezan — uvodna scena je nacrtana u SVG-u i canvas-u i radi
i bez njega. Kad snimak postoji, upiši putanje u `data-` atribute video
elementa u `index.html`:

```html
<video class="intro__video" id="introVideo" data-mp4="video/intro.mp4"
       data-webm="video/intro.webm" data-poster="images/intro-poster.jpg"></video>
```

Dok su ti atributi prazni, pregledač ne šalje nijedan zahtev za video.
