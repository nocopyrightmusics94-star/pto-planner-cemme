# Pianificatore Ferie e Permessi — C. Emme Impianti S.r.l.

Applicazione aziendale moderna, reattiva e strategica per la pianificazione e l'ottimizzazione di ferie, permessi retribuiti (ROL), festività nazionali italiane e ponti festivi, sviluppata su misura per **C. Emme Impianti S.r.l.** (Casoria, NA — [cemmeimpianti.it](https://www.cemmeimpianti.it/)), ispirata all'architettura visiva di *pto-planner*.

---

## 🌟 Caratteristiche Principali

- **100% in Lingua Italiana**: Interfaccia aziendale priva di qualsiasi anglicismo o termine estero.
- **Identità Aziendale Ufficiale**: Logo istituzionale originale di C. Emme Impianti S.r.l., palette colori blu tecnico (`#0042ff`) e accenti rossi di sicurezza.
- **Controllo Utenze e Sicurezza**:
  - Utenza predefinita iniziale di fabbrica: **`titolare`** (chiave d'accesso: `cemme2025`).
  - Il Titolare può aggiungere nuove utenze (dipendenti/tecnici delle squadre) fornendo semplicemente **Identificativo (ID)** e **Password**, oltre a impostare il monte ferie annuo (CCNL) e le ore di ROL.
  - Ciascun dipendente accede con le proprie credenziali e gestisce il proprio piano ferie.
  - **Quadro Generale Aziendale**: Il Titolare ha a disposizione una vista matriciale di tutto il personale con rilevamento automatico delle sovrapposizioni, per garantire la costante copertura operativa dei cantieri e degli impianti ferroviari.
- **Calendario Annuale a Colpo d'Occhio (12 Mesi)**:
  - Selezione rapida con un clic: Ferie Intera (1 gg), Mezza Giornata (0.5 gg), Permesso ROL (4 o 8 ore).
  - Festività nazionali italiane precaricate e calcolo canonico della Pasqua e del Lunedì dell'Angelo per qualsiasi anno solare.
  - Festa patronale di Casoria (San Mauro Abate, 15 Gennaio) inclusa.
- **Motore di Ottimizzazione Ponti**:
  - Calcola automaticamente le combinazioni più vantaggiose tra festività e fine settimana (es. 1 giorno di ferie per ottenere 4 o 5 giorni di riposo continuativo).
  - Pulsante per applicare o revocare il ponte in 1 clic.
- **Copia di Sicurezza (Backup & Ripristino)**:
  - Esportazione istantanea di tutti i dati aziendali in formato JSON.
  - Ripristino in 1 clic su qualsiasi altro dispositivo.

---

## 🔑 Credenziali di Primo Accesso

All'avvio, l'applicazione è configurata con la sola utenza della Direzione:

| Campo | Valore Predefinito | Note |
| :--- | :--- | :--- |
| **Identificativo Utenza (ID)** | `titolare` | Utenza Amministratore Supremo |
| **Chiave d'Accesso (Password)** | `cemme2025` | Modificabile dal Titolare in qualunque momento |

Una volta effettuato l'accesso come Titolare:
1. Clicca su **"Gestione Utenze"** nella barra superiore.
2. Inserisci l'ID e la Password per ciascun dipendente o caposquadra (es. ID `m.rossi`, Password `tecnico2025`).
3. Il dipendente potrà accedere direttamente dal proprio computer o telefono con le credenziali assegnate.

---

## 🚀 Come Pubblicarla Online GRATIS H24 all'Infinito (Zero Sleep)

Per mantenere il portale attivo 24 ore su 24, 7 giorni su 7, a **costo zero per sempre** e con una velocità di caricamento fulminea (senza sospensione/ibernazione dei server gratuiti tradizionali):

### Scelta Consigliata: Vercel (2 Minuti)

1. Crea un account gratuito su [vercel.com](https://vercel.com) (puoi registrarti anche tramite GitHub).
2. Carica questa cartella di progetto sul tuo account [GitHub](https://github.com) (puoi renderla privata).
3. Su Vercel, premi su **"Add New Project"** e seleziona il repository GitHub appena creato.
4. Vercel rileverà automaticamente la configurazione inclusa (`vercel.json`).
5. Clicca su **"Deploy"**.
6. **Fatto!** L'applicazione sarà online all'indirizzo `https://cemme-ferie.vercel.app` (o nome a tua scelta).
   - È sempre online 24/7/365.
   - Nessun costo mensile né annuale.
   - Puoi anche collegare gratuitamente un dominio personalizzato dell'azienda (es. `ferie.cemmeimpianti.it`).

### Alternativa: Cloudflare Pages

1. Accedi a [cloudflare.com](https://cloudflare.com) gratuitamente.
2. Vai su **"Workers & Pages"** > **"Create Application"** > **"Pages"**.
3. Connetti il tuo repository GitHub e seleziona come comando di compilazione `npm run build` e come cartella di output `dist`.
4. Cloudflare Pages garantisce banda e richieste illimitate al 100% a costo zero permanente.

---

## 💻 Esecuzione Locale sul Tuo Computer

Per avviare l'applicazione in locale durante lo sviluppo o l'uso in ufficio:

```bash
# Installa le dipendenze (se non già fatto)
npm install

# Avvia il server di sviluppo locale
npm run dev

# Compila l'applicazione per la produzione
npm run build
```

L'applicazione sarà accessibile su `http://localhost:3000`.

---

## 🏢 C. Emme Impianti S.r.l.
- **Sede Legale:** Via G. Pelella 17, 80026 Casoria (NA)
- **Telefono:** +39 081 3446736
- **PEC:** c.emmeimpiantisrl@legalmail.it
- **Sito Web:** [www.cemmeimpianti.it](https://www.cemmeimpianti.it/)
