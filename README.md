# Bedazzle & Bloom — workshop registration

A recreation of the Bedazzle & Bloom workshop registration page, rebuilt from the
screen recording, plus an **about us** tab, a contact footer, and a drink picker
on the can option.

```
bedazzle/
├── index.html          markup for all three steps + about + footer
├── styles.css          all styling (design tokens at the top)
├── app.js              selection, totals, step flow, validation, submit
├── assets/
│   └── upi-qr.png      the SBI UPI QR for 8744000846@sbi (Akshya)
└── README.md
```

No build step and no dependencies — open `index.html`, or serve the folder:

```bash
python -m http.server 5183 --directory bedazzle
```

Fonts (Fredoka, Quicksand, Caveat Brush) load from Google Fonts; everything else
is local, so the page works offline apart from the font swap.

---

## Things you'll probably want to change

| What | Where |
|---|---|
| Item prices | `data-price` on each `.opt-input` in `index.html` |
| Drinks & their prices | the `<option>`s inside `<select id="drink">` — the `data-price` on each one is what's charged |
| Item names / blurbs | `.name` and `.desc` in each `<li class="option">` |
| UPI payee, name, note | `UPI` object at the top of `app.js` |
| QR image | `assets/upi-qr.png` |
| Where registrations are sent | `ENDPOINT` in `app.js` (see below) |
| Colours, sizes | the `:root` block in `styles.css` |

To add a drink, copy a line in the `<select>` — the label is what people see and
`data-price` is what it costs. If a new drink falls outside ₹200–300, update the
`₹200–300` label on that row too.

### Wiring up submission

`ENDPOINT` is `null`, so **Submit Registration** validates, shows the
confirmation screen, and sends nothing anywhere. Point it at a URL and the form
POSTs `multipart/form-data` with `name`, `phone`, `email`, `items` (JSON),
`total`, and `proof` (the uploaded screenshot). Anything that accepts a form
POST works — a Google Apps Script web app, Formspree, or your own endpoint.

The `items` JSON carries the drink or the brought item as a `note`, e.g.
`{"key":"can","label":"Soft Drink Can","price":300,"note":"Monster (pink, white)"}`.

### The QR has no amount in it

The QR is your static SBI collect QR, so the payer types the amount themselves.
That's why the payment step shows **pay ₹N** above the QR. The
**pay in upi app** button underneath builds a `upi://pay?…&am=<total>` deep link,
so on a phone the amount is pre-filled.

---

## Where this departs from the recording

The recording covers steps 1–3 and ends on the payment screen. These parts were
changed, filled in, or adjusted:

- **"Diet Coke Can" is now "Soft Drink Can"** with a drink dropdown in place of
  the free-text box. The row is priced `₹200–300` (following the same range
  convention the "Bring Your Own Item" row already used), and the total charges
  whichever drink is picked. Ticking the row adds the ₹200 base straight away,
  as it did in the recording, and **Register Now** won't advance until a drink is
  actually chosen — the field turns red if you try.
- **"Bring Your Own Item" counts as ₹150** in the total — the lower end of the
  advertised ₹150–180, since the real price depends on the item. Change
  `data-price` on `#opt-own` if you'd rather quote the top of the range.
- **"Bring Your Own Item" reveals a text input** ("What are you bringing to
  bedazzle?"), mirroring the follow-up the can option shows. That option was
  never ticked on camera, so this is an inference.
- **The add-on shows `+₹100`.** The original showed no price on that row even
  though toggling it changes the total.
- **The confirmation screen is new.** The recording stops at payment, so the
  "You're in!" screen with the receipt is a design decision.
- **Typed text in the form fields is dark.** The original rendered it in the same
  cream as the page ink, which is unreadable on the cream field. Set
  `--input-ink` to `#F6F3F0` in `styles.css` for the original's exact behaviour.
- **The about tab and footer** are additions, not part of the original page.
