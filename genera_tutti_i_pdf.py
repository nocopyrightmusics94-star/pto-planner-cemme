import os
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Image, Table, TableStyle, PageBreak, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfgen import canvas

URL_PORTALE = "https://ferie-cemme.askreddit098.workers.dev"

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super(NumberedCanvas, self).__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super(NumberedCanvas, self).showPage()
        super(NumberedCanvas, self).save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748b"))
        
        # Piè di pagina elegante
        page_text = f"Pagina {self._pageNumber} di {page_count}"
        self.drawRightString(A4[0] - 40, 22, page_text)
        self.drawString(40, 22, "C. Emme Impianti S.r.l. — Portale Aziendale Ferie e Permessi — Documento Riservato")
        
        self.setStrokeColor(colors.HexColor("#cbd5e1"))
        self.setLineWidth(0.5)
        self.line(40, 32, A4[0] - 40, 32)
        
        self.restoreState()

def crea_stili():
    styles = getSampleStyleSheet()
    
    styles.add(ParagraphStyle(
        name='TitoloDoc',
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        textColor=colors.HexColor('#1e3a8a'),
        spaceAfter=4
    ))
    
    styles.add(ParagraphStyle(
        name='SottotitoloDoc',
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#475569'),
        spaceAfter=10
    ))

    styles.add(ParagraphStyle(
        name='SezioneTitolo',
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor('#1e3a8a'),
        spaceBefore=8,
        spaceAfter=5,
        keepWithNext=True
    ))

    styles.add(ParagraphStyle(
        name='Corpo',
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor('#1e293b'),
        spaceAfter=5
    ))

    styles.add(ParagraphStyle(
        name='CorpoGrassetto',
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor('#0f172a'),
        spaceAfter=4
    ))

    styles.add(ParagraphStyle(
        name='BoxNota',
        fontName='Helvetica',
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor('#0f766e')
    ))

    styles.add(ParagraphStyle(
        name='PassoNumero',
        fontName='Helvetica-Bold',
        fontSize=9.5,
        leading=12,
        textColor=colors.HexColor('#ffffff')
    ))

    styles.add(ParagraphStyle(
        name='PassoTesto',
        fontName='Helvetica',
        fontSize=8.5,
        leading=12,
        textColor=colors.HexColor('#1e293b')
    ))

    return styles

def crea_header_aziendale(stili, titolo, sottotitolo):
    elementi = []
    logo_path = 'guide_risorse/logo-cemme.png'
    dati_testo = Paragraph(
        "<b>C. EMME IMPIANTI S.R.L.</b> — Impianti Tecnologici e Ferroviari<br/>"
        "Via G. Pelella 17, 80026 Casoria (NA) | "
        f"<b>Portale:</b> <font color='#2563eb'><b>{URL_PORTALE}</b></font>",
        stili['Corpo']
    )
    
    if os.path.exists(logo_path):
        img_logo = Image(logo_path, width=130, height=37)
        tab_header = Table([[img_logo, dati_testo]], colWidths=[140, 375])
    else:
        tab_header = Table([[Paragraph("<b>C. EMME IMPIANTI</b>", stili['TitoloDoc']), dati_testo]], colWidths=[140, 375])
        
    tab_header.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
    ]))
    elementi.append(tab_header)
    elementi.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#1e3a8a"), spaceAfter=8))
    elementi.append(Paragraph(titolo, stili['TitoloDoc']))
    elementi.append(Paragraph(sottotitolo, stili['SottotitoloDoc']))
    return elementi

def crea_box_evidenza(testo_html, stili, colore_bordo="#0284c7", colore_sfondo="#f0f9ff"):
    p = Paragraph(testo_html, stili['BoxNota'])
    tab = Table([[p]], colWidths=[515])
    tab.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor(colore_sfondo)),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor(colore_bordo)),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('RIGHTPADDING', (0,0), (-1,-1), 10),
    ]))
    return tab

# -------------------------------------------------------------
# 1. GUIDA DIPENDENTI ANDROID (Esattamente 2 pagine)
# -------------------------------------------------------------
def genera_guida_android(stili):
    filename = "GUIDA_DIPENDENTI_ANDROID.pdf"
    doc = SimpleDocTemplate(filename, pagesize=A4, leftMargin=40, rightMargin=40, topMargin=30, bottomMargin=40)
    story = []
    
    # --- PAGINA 1: INSTALLAZIONE HOME ---
    story.extend(crea_header_aziendale(
        stili,
        "Guida Dipendente: Accesso & Uso su Android",
        "Istruzioni illustrate per installare l'icona aziendale sulla schermata Home tramite Google Chrome."
    ))
    
    story.append(crea_box_evidenza(
        "<b>PERCHÉ IL SEGNALIBRO PWA SU HOME È PREFERIBILE ALL'APK?</b><br/>"
        "Grazie alla tecnologia Progressive Web App (PWA), installando il portale dal browser Chrome si ottiene "
        "un'app a pieno schermo identica a un'applicazione nativa, <b>senza blocchi di sicurezza Play Protect</b> o avvisi "
        "di 'file dannoso' tipici dei file APK non certificati, e con <b>aggiornamenti automatici in tempo reale</b>.",
        stili, colore_bordo="#059669", colore_sfondo="#ecfdf5"
    ))
    story.append(Spacer(1, 8))
    
    story.append(Paragraph("1. Installazione dell'Icona sulla Schermata Home", stili['SezioneTitolo']))
    
    img_android = 'guide_risorse/passaggi_android.png'
    if os.path.exists(img_android):
        story.append(Image(img_android, width=515, height=195))
        story.append(Spacer(1, 8))
        
    passaggi_testo = [
        ("Passo 1", f"Apri <b>Google Chrome</b> sul tuo smartphone e naviga all'indirizzo:<br/><font color='#2563eb'><b>{URL_PORTALE}</b></font>"),
        ("Passo 2", "In fondo allo schermo comparirà il messaggio: <b>'Aggiungi Cemme Ferie a schermata Home'</b>.<br/><i>Se non compare, tocca i tre puntini verticali in alto a destra e premi <b>'Installa applicazione'</b>.</i>"),
        ("Passo 3", "Tocca <b>'Installa'</b>: l'icona ufficiale di C. Emme Impianti apparirà tra le app del tuo smartphone."),
        ("Passo 4", "Toccando l'icona, il portale si avvierà a tutto schermo esattamente come un'app scaricata dal Play Store.")
    ]
    
    tab_passi = []
    for num, txt in passaggi_testo:
        p_num = Paragraph(f"<font color='#ffffff'><b>{num}</b></font>", stili['PassoNumero'])
        p_txt = Paragraph(txt, stili['PassoTesto'])
        tab_passi.append([p_num, p_txt])
        
    t = Table(tab_passi, colWidths=[65, 450])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (0,-1), colors.HexColor('#059669')),
        ('BACKGROUND', (1,0), (1,-1), colors.HexColor('#f8fafc')),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t)
    
    story.append(PageBreak())
    
    # --- PAGINA 2: COME RICHIEDERE FERIE, PERMESSI E MALATTIA ---
    story.append(Paragraph("2. Come Richiedere Ferie, Permessi Orari o Malattia", stili['SezioneTitolo']))
    
    img_mockup = 'guide_risorse/mockup_richiesta_hd.png'
    if os.path.exists(img_mockup):
        # Aspect ratio 1.607: width 490, height 305
        story.append(Image(img_mockup, width=490, height=305))
        story.append(Spacer(1, 10))
        
    istruzioni = (
        "<b>Istruzioni per l'inoltro delle richieste:</b><br/>"
        "• <b>Accesso al Portale:</b> Inserisci l'ID Utenza (es. <code>m.rossi</code>) e la password forniti dalla Direzione.<br/>"
        "• <b>Tasto '+ Nuova Richiesta':</b> Tocca il pulsante blu in alto a destra per aprire il modulo.<br/>"
        "• <b>Scelta della Tipologia:</b><br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;1. <b>Ferie Intera:</b> tocca il primo giorno e l'ultimo giorno sul mini calendario per selezionare più giorni continuativi.<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;2. <b>Permesso Orario:</b> seleziona la data e imposta liberamente le ore necessarie (da 1 a 8 ore).<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;3. <b>Malattia:</b> registra le date e digita il <b>Numero di Protocollo INPS</b> (puoi integrarlo anche successivamente).<br/>"
        "• <b>Conferma e Invio:</b> Premi <b>'Invia Richiesta al Titolare'</b>. L'assenza comparirà in stato <i>In attesa</i> e riceverai conferma all'approvazione."
    )
    story.append(Paragraph(istruzioni, stili['Corpo']))
    
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Generato {filename}")

# -------------------------------------------------------------
# 2. GUIDA DIPENDENTI APPLE iOS (Esattamente 2 pagine)
# -------------------------------------------------------------
def genera_guida_ios(stili):
    filename = "GUIDA_DIPENDENTI_IOS_IPHONE.pdf"
    doc = SimpleDocTemplate(filename, pagesize=A4, leftMargin=40, rightMargin=40, topMargin=30, bottomMargin=40)
    story = []
    
    # --- PAGINA 1: INSTALLAZIONE SAFARI ---
    story.extend(crea_header_aziendale(
        stili,
        "Guida Dipendente: Accesso & Uso su iPhone (iOS)",
        "Procedura illustrata da Safari per aggiungere l'icona alla schermata Home e usare il portale a schermo intero."
    ))
    
    story.append(crea_box_evidenza(
        "<b>INSTALLAZIONE SENZA APP STORE SU IPHONE:</b><br/>"
        "Su dispositivi Apple iOS (iPhone e iPad) non occorre passare per l'App Store: utilizzando il browser nativo <b>Safari</b> "
        "puoi salvare l'applicazione direttamente sulla schermata principale. L'app si aprirà a tutto schermo senza la barra di Safari, "
        "offrendo la massima fluidità e privacy.",
        stili, colore_bordo="#2563eb", colore_sfondo="#eff6ff"
    ))
    story.append(Spacer(1, 8))
    
    story.append(Paragraph("1. Come Aggiungere l'Icona alla Schermata Home di iPhone", stili['SezioneTitolo']))
    
    img_ios = 'guide_risorse/passaggi_ios.png'
    if os.path.exists(img_ios):
        story.append(Image(img_ios, width=515, height=195))
        story.append(Spacer(1, 8))
        
    passaggi_ios = [
        ("Passo 1", f"Apri <b>Safari</b> (icona bussola) e naviga all'indirizzo:<br/><font color='#2563eb'><b>{URL_PORTALE}</b></font>"),
        ("Passo 2", "In basso al centro dello schermo, tocca il pulsante <b>Condividi</b> (il quadrato con la freccia rivolta verso l'alto)."),
        ("Passo 3", "Nel menu delle opzioni, scorri verso il basso e tocca: <b>'Aggiungi alla schermata Home'</b> (icona con il simbolo +)."),
        ("Passo 4", "In alto a destra tocca <b>'Aggiungi'</b>: l'icona ufficiale C. Emme Impianti comparirà sulla schermata principale del tuo iPhone!")
    ]
    
    tab_passi = []
    for num, txt in passaggi_ios:
        p_num = Paragraph(f"<font color='#ffffff'><b>{num}</b></font>", stili['PassoNumero'])
        p_txt = Paragraph(txt, stili['PassoTesto'])
        tab_passi.append([p_num, p_txt])
        
    t = Table(tab_passi, colWidths=[65, 450])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (0,-1), colors.HexColor('#2563eb')),
        ('BACKGROUND', (1,0), (1,-1), colors.HexColor('#f8fafc')),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t)
    
    story.append(PageBreak())
    
    # --- PAGINA 2: DASHBOARD & USO QUOTIDIANO ---
    story.append(Paragraph("2. Dashboard Collaboratore & Gestione Notifiche", stili['SezioneTitolo']))
    
    scr_dash = 'guide_risorse/schermata_dashboard.png'
    if os.path.exists(scr_dash):
        story.append(Image(scr_dash, width=490, height=247))
        story.append(Spacer(1, 10))
        
    testo_uso = (
        "<b>Funzionalità principali della dashboard:</b><br/>"
        "• <b>Indicatori Riepilogativi:</b> In cima alla schermata tieni sempre sotto controllo il totale di <i>Ferie Godute</i> (giorni fruiti), "
        "le ore di <i>Permessi Orari</i> consumate, i giorni di <i>Malattia</i> certificati e il numero di richieste <i>In attesa di conferma</i>.<br/>"
        "• <b>Navigazione Calendario:</b> Consulta il mese corrente con evidenziate le tue assenze approvate in azzurro e naviga nei mesi con le frecce.<br/>"
        "• <b>Storico Personale:</b> Nella scheda <i>'Il Tuo Storico Personale'</i> puoi rivedere tutte le richieste passate con stato, date e note.<br/>"
        "• <b>Notifiche In-App:</b> Nel caso in cui la Direzione debba revocare ferie per improvvise esigenze di cantiere o dichiari una Chiusura Aziendale, "
        "vedrai comparire un avviso in evidenza con la causale ufficiale."
    )
    story.append(Paragraph(testo_uso, stili['Corpo']))
    
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Generato {filename}")

# -------------------------------------------------------------
# 3. GUIDA UNIFICATA DIPENDENTI (ANDROID + IOS) - ESATTAMENTE 2 PAGINE
# -------------------------------------------------------------
def genera_guida_unificata(stili):
    filename = "GUIDA_UNIFICATA_DIPENDENTI_SMARTPHONE.pdf"
    doc = SimpleDocTemplate(filename, pagesize=A4, leftMargin=40, rightMargin=40, topMargin=25, bottomMargin=35)
    story = []
    
    # --- PAGINA 1: LE DUE MODALITÀ DI INSTALLAZIONE A CONFRONTO ---
    story.extend(crea_header_aziendale(
        stili,
        "Manuale Dipendenti: Accesso Rapido su Smartphone",
        "Guida per installare l'icona aziendale sulla Home di qualsiasi smartphone (Apple iPhone o Android)."
    ))
    
    story.append(crea_box_evidenza(
        f"<b>INDIRIZZO UFFICIALE DEL PORTALE:</b> <font color='#2563eb'><b>{URL_PORTALE}</b></font><br/>"
        "Il portale è accessibile 24 ore su 24 da qualsiasi smartphone. Non occorre scaricare app pesanti dagli store: "
        "segui la procedura specifica per il tuo telefono riportata qui sotto per salvare il collegamento sulla Home.",
        stili, colore_bordo="#1e3a8a", colore_sfondo="#f8fafc"
    ))
    story.append(Spacer(1, 6))
    
    # SCHEDA 1: METODO APPLE IPHONE
    story.append(Paragraph("A) Per chi possiede un APPLE iPhone / iPad (Safari)", stili['SezioneTitolo']))
    img_ios = 'guide_risorse/passaggi_ios.png'
    if os.path.exists(img_ios):
        story.append(Image(img_ios, width=500, height=155))
        story.append(Spacer(1, 6))
        
    # SCHEDA 2: METODO ANDROID
    story.append(Paragraph("B) Per chi possiede uno smartphone ANDROID (Google Chrome)", stili['SezioneTitolo']))
    img_android = 'guide_risorse/passaggi_android.png'
    if os.path.exists(img_android):
        story.append(Image(img_android, width=500, height=155))
        story.append(Spacer(1, 4))
        
    story.append(PageBreak()) # PAGINA 2 PER L'USO OPERATIVO
    
    # --- PAGINA 2: COME RICHIEDERE FERIE, PERMESSI E MALATTIA ---
    story.append(Paragraph("Come Utilizzare il Portale: Invio e Gestione Assenze", stili['SezioneTitolo']))
    
    img_mockup = 'guide_risorse/mockup_richiesta_hd.png'
    if os.path.exists(img_mockup):
        # Risoluzione Retina ad alta fedeltà, zero distorsione: larghezza 490, altezza 305
        story.append(Image(img_mockup, width=490, height=305))
        story.append(Spacer(1, 8))
        
    dettaglio_funzioni = [
        ("🌴 Ferie a Giornata Intera", "Tocca la prima e l'ultima data desiderata sul mini calendario. Il sistema calcola in automatico le sole giornate lavorative reali (escludendo sabati, domeniche e festività nazionali)."),
        ("⏰ Permessi Orari (ROL)", "Permette di scegliere quante ore assentarsi nella giornata (da 1 a 8 ore) per visite specialistiche o impegni personali urgenti."),
        ("🩺 Malattia & Protocollo INPS", "Registra i giorni di assenza per malattia e permette di inserire il Numero di Protocollo telematico INPS (anche successivamente all'invio iniziale)."),
        ("🔔 Notifiche & Comunicazioni", "Ogni decisione della Direzione (approvazione, rifiuto, revoca per cantiere o chiusura aziendale) compare in tempo reale nella bacheca personale.")
    ]
    
    tab_funz = []
    for tit, desc in dettaglio_funzioni:
        p_t = Paragraph(f"<b>{tit}</b>", stili['CorpoGrassetto'])
        p_d = Paragraph(desc, stili['Corpo'])
        tab_funz.append([p_t, p_d])
        
    t = Table(tab_funz, colWidths=[155, 355])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f8fafc')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))
    story.append(t)
    story.append(Spacer(1, 6))
    
    story.append(crea_box_evidenza(
        "<b>ASSISTENZA E SUPPORTO:</b> In caso di smarrimento della password o chiarimenti sull'utilizzo del portale, "
        "rivolgersi alla Direzione Generale di C. Emme Impianti S.r.l.",
        stili, colore_bordo="#2563eb", colore_sfondo="#eff6ff"
    ))
    
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Generato {filename}")

# -------------------------------------------------------------
# 4. MANUALE OPERATIVO TITOLARE (Esattamente 2 pagine)
# -------------------------------------------------------------
def genera_manuale_titolare(stili):
    filename = "MANUALE_OPERATIVO_TITOLARE.pdf"
    doc = SimpleDocTemplate(filename, pagesize=A4, leftMargin=40, rightMargin=40, topMargin=30, bottomMargin=40)
    story = []
    
    # --- PAGINA 1: GESTIONE UTENZE & CREDENZIALI ---
    story.extend(crea_header_aziendale(
        stili,
        "Manuale Operativo Direzione: Gestione Ferie & Personale",
        "Documento riservato al Titolare per l'amministrazione di utenze, approvazioni, revoche e chiusure aziendali."
    ))
    
    story.append(crea_box_evidenza(
        "<b>ACCESSO RISERVATO ALLA DIREZIONE GENERALE:</b><br/>"
        "• <b>Identificativo Utenza:</b> <code>titolare</code><br/>"
        "• <b>Chiave d'Accesso (Password iniziale):</b> <code>cemme2026</code><br/>"
        "Con questa utenza il Titolare dispone dei massimi privilegi di gestione, supervisione e sovrascrittura.",
        stili, colore_bordo="#b45309", colore_sfondo="#fffbeb"
    ))
    story.append(Spacer(1, 6))
    
    story.append(Paragraph("1. Gestione Utenze Aziendali (Dipendenti e Responsabili)", stili['SezioneTitolo']))
    scr_utenze = 'guide_risorse/schermata_utenze.png'
    if os.path.exists(scr_utenze):
        story.append(Image(scr_utenze, width=490, height=188))
        story.append(Spacer(1, 6))
        
    testo_utenze = (
        "Dalla barra in alto cliccando su <b>'Gestione Utenze'</b> il Titolare può:<br/>"
        "• <b>Creare Nuove Utenze:</b> Inserire ID (es. <code>m.rossi</code>), Nome e Cognome, Password, Reparto e Telefono.<br/>"
        "• <b>Assegnare il Ruolo di Responsabile:</b> Spuntando la casella <i>'Utenza con ruolo di Responsabile'</i>, "
        "l'utente creato potrà validare e approvare le ferie dei colleghi, ma le sue personali richieste dovranno essere autorizzate esclusivamente dal Titolare.<br/>"
        "• <b>Modifica Password ed Eliminazione:</b> Modificare le password dei dipendenti in caso di smarrimento o eliminare utenze dismesse."
    )
    story.append(Paragraph(testo_utenze, stili['Corpo']))
    
    story.append(PageBreak())
    
    # --- PAGINA 2: SUPERVISIONE, REVOCHE E CHIUSURE ---
    story.append(Paragraph("2. Supervisione Calendario con Nomi dei Collaboratori", stili['SezioneTitolo']))
    testo_cal = (
        "A differenza della schermata del dipendente, il Titolare visualizza direttamente in ogni casella giornaliera il "
        "<b>nominativo della persona assente</b> con badge identificativo a colori:<br/>"
        "• <code>👤 Mario Rossi (Ferie)</code> in azzurro.<br/>"
        "• <code>🩺 Giuseppe Verdi (Malattia)</code> in verde smeraldo con protocollo.<br/>"
        "• <code>⏰ Antonio N. (4h)</code> in viola con ore di permesso.<br/>"
        "• <code>⏳ Collaboratore (In attesa)</code> in ambra (richiesta da convalidare con apposito pulsante)."
    )
    story.append(Paragraph(testo_cal, stili['Corpo']))
    story.append(Spacer(1, 6))
    
    story.append(Paragraph("3. Inserimento Ferie Diretto & Revoca con Notifica", stili['SezioneTitolo']))
    testo_ins = (
        "• <b>Inserimento per i Dipendenti:</b> Cliccando su <i>'Nuova Richiesta'</i>, il Titolare può selezionare dal menu a tendina il dipendente desiderato: "
        "la richiesta viene <b>approvata d'ufficio all'istante</b>.<br/>"
        "• <b>Revoca Ferie per Urgenze di Cantiere:</b> Cliccando sulla giornata a calendario o sulla richiesta nello Storico, è presente il pulsante "
        "<b>'Revoca Ferie & Notifica Dipendente'</b>. Inserendo la motivazione aziendale (es. <i>'Esigenze improcrastinabili presidio cantiere ferroviario'</i>), "
        "l'assenza viene annullata e il collaboratore riceve subito una notifica in bacheca."
    )
    story.append(Paragraph(testo_ins, stili['Corpo']))
    story.append(Spacer(1, 6))
    
    story.append(Paragraph("4. Chiusura Aziendale Collettiva & Storico Personale", stili['SezioneTitolo']))
    testo_chiusura = (
        "• <b>Chiusura Aziendale:</b> Dal pulsante dedicato, il Titolare programma i periodi di chiusura estiva o festiva: il sistema calcola in automatico "
        "i soli giorni lavorativi e applica il blocco a tutti i dipendenti con notifica immediata.<br/>"
        "• <b>Storico Persona per Persona:</b> Nella scheda <i>'Storico Assenze'</i>, il Titolare può filtrare per singolo collaboratore per verificare "
        "il dettaglio analitico di ferie, permessi e malattie usufruiti nel corso dell'anno."
    )
    story.append(Paragraph(testo_chiusura, stili['Corpo']))
    
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Generato {filename}")

if __name__ == '__main__':
    stili = crea_stili()
    genera_guida_android(stili)
    genera_guida_ios(stili)
    genera_guida_unificata(stili)
    genera_manuale_titolare(stili)
    print("Tutti i 4 PDF sono stati rigenerati con successo!")
