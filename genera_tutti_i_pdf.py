import os
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Image, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
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
        
        # Piè di pagina
        page_text = f"Pagina {self._pageNumber} di {page_count}"
        self.drawRightString(A4[0] - 40, 25, page_text)
        self.drawString(40, 25, "C. Emme Impianti S.r.l. — Portale Aziendale Ferie e Permessi — Documento Riservato")
        
        # Linea sottile piè di pagina
        self.setStrokeColor(colors.HexColor("#cbd5e1"))
        self.setLineWidth(0.5)
        self.line(40, 36, A4[0] - 40, 36)
        
        self.restoreState()

def crea_stili():
    styles = getSampleStyleSheet()
    
    styles.add(ParagraphStyle(
        name='TitoloDoc',
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=colors.HexColor('#1e3a8a'),
        alignment=0,
        spaceAfter=6
    ))
    
    styles.add(ParagraphStyle(
        name='SottotitoloDoc',
        fontName='Helvetica',
        fontSize=11,
        leading=15,
        textColor=colors.HexColor('#475569'),
        spaceAfter=15
    ))

    styles.add(ParagraphStyle(
        name='SezioneTitolo',
        fontName='Helvetica-Bold',
        fontSize=14,
        leading=18,
        textColor=colors.HexColor('#1e3a8a'),
        spaceBefore=14,
        spaceAfter=8,
        keepWithNext=True
    ))

    styles.add(ParagraphStyle(
        name='SottoSezioneTitolo',
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=15,
        textColor=colors.HexColor('#0369a1'),
        spaceBefore=10,
        spaceAfter=4,
        keepWithNext=True
    ))

    styles.add(ParagraphStyle(
        name='Corpo',
        fontName='Helvetica',
        fontSize=9.5,
        leading=13.5,
        textColor=colors.HexColor('#1e293b'),
        spaceAfter=6
    ))

    styles.add(ParagraphStyle(
        name='CorpoGrassetto',
        fontName='Helvetica-Bold',
        fontSize=9.5,
        leading=13.5,
        textColor=colors.HexColor('#0f172a'),
        spaceAfter=6
    ))

    styles.add(ParagraphStyle(
        name='BoxNota',
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor('#0f766e'),
        spaceAfter=4
    ))

    styles.add(ParagraphStyle(
        name='PassoNumero',
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=13,
        textColor=colors.HexColor('#ffffff')
    ))

    styles.add(ParagraphStyle(
        name='PassoTesto',
        fontName='Helvetica',
        fontSize=9,
        leading=12.5,
        textColor=colors.HexColor('#1e293b')
    ))

    return styles

def crea_header_aziendale(stili, titolo, sottotitolo):
    elementi = []
    
    # Tabella con Logo a sinistra e Dati a destra
    logo_path = 'guide_risorse/logo-cemme.png'
    dati_testo = Paragraph(
        "<b>C. EMME IMPIANTI S.R.L.</b><br/>"
        "Impianti Tecnologici e Ferroviari<br/>"
        "Via G. Pelella 17, 80026 Casoria (NA)<br/>"
        f"<b>Portale:</b> <font color='#2563eb'>{URL_PORTALE}</font>",
        stili['Corpo']
    )
    
    if os.path.exists(logo_path):
        img_logo = Image(logo_path, width=140, height=40)
        tab_header = Table([[img_logo, dati_testo]], colWidths=[150, 365])
    else:
        tab_header = Table([[Paragraph("<b>C. EMME IMPIANTI</b>", stili['TitoloDoc']), dati_testo]], colWidths=[150, 365])
        
    tab_header.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
    ]))
    elementi.append(tab_header)
    elementi.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#1e3a8a"), spaceAfter=12))
    
    # Titolo del Documento
    elementi.append(Paragraph(titolo, stili['TitoloDoc']))
    elementi.append(Paragraph(sottotitolo, stili['SottotitoloDoc']))
    return elementi

def crea_box_evidenza(testo_html, stili, colore_bordo="#0284c7", colore_sfondo="#f0f9ff"):
    p = Paragraph(testo_html, stili['BoxNota'])
    tab = Table([[p]], colWidths=[515])
    tab.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor(colore_sfondo)),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor(colore_bordo)),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('LEFTPADDING', (0,0), (-1,-1), 12),
        ('RIGHTPADDING', (0,0), (-1,-1), 12),
    ]))
    return tab

# -------------------------------------------------------------
# 1. GUIDA DIPENDENTI ANDROID
# -------------------------------------------------------------
def genera_guida_android(stili):
    filename = "GUIDA_DIPENDENTI_ANDROID.pdf"
    doc = SimpleDocTemplate(filename, pagesize=A4, leftMargin=40, rightMargin=40, topMargin=35, bottomMargin=45)
    story = []
    
    story.extend(crea_header_aziendale(
        stili,
        "Guida Dipendente: Accesso & Uso su Android",
        "Istruzioni illustrate per installare l'icona sulla schermata Home e richiedere ferie, permessi e malattia."
    ))
    
    story.append(crea_box_evidenza(
        "<b>PERCHÉ IL SEGNALIBRO SULLA HOME?</b><br/>"
        "Grazie alla tecnologia Progressive Web App (PWA), aggiungendo il collegamento dal browser Google Chrome, "
        "il portale aziendale funziona esattamente come un'app nativa: si apre a schermo intero senza barre del browser, "
        "si aggiorna automaticamente da sola e non richiede permessi speciali o disattivazione di antivirus come accade per i file APK non firmati.",
        stili, colore_bordo="#059669", colore_sfondo="#ecfdf5"
    ))
    story.append(Spacer(1, 10))
    
    story.append(Paragraph("1. Installazione dell'Icona sulla Schermata Home", stili['SezioneTitolo']))
    
    # Immagine passaggi android
    img_android = 'guide_risorse/passaggi_android.png'
    if os.path.exists(img_android):
        story.append(Image(img_android, width=515, height=206))
        story.append(Spacer(1, 10))
        
    passaggi_testo = [
        ("Passo 1", f"Apri <b>Google Chrome</b> sul tuo telefono Android e digita il link:<br/><font color='#2563eb'><b>{URL_PORTALE}</b></font>"),
        ("Passo 2", "In fondo allo schermo comparirà automaticamente un avviso: <b>'Aggiungi Cemme Ferie a schermata Home'</b>.<br/><i>Se non compare, tocca i tre puntini verticali in alto a destra di Chrome e seleziona <b>'Aggiungi a schermata Home'</b> oppure <b>'Installa applicazione'</b>.</i>"),
        ("Passo 3", "Tocca <b>'Installa'</b> o <b>'Aggiungi'</b>. L'icona ufficiale con il logo C. Emme Impianti comparirà sulla tua schermata principale tra le tue applicazioni!"),
        ("Passo 4", "Toccando l'icona sul desktop, il portale si aprirà a schermo intero, pronto all'uso immediato.")
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
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t)
    story.append(Spacer(1, 14))
    
    story.append(Paragraph("2. Come Richiedere Ferie, Permessi Orari o Malattia", stili['SezioneTitolo']))
    
    scr_richiesta = 'guide_risorse/schermata_richiesta.png'
    if os.path.exists(scr_richiesta):
        story.append(Image(scr_richiesta, width=515, height=270))
        story.append(Spacer(1, 8))
        
    istruzioni = (
        "<b>Come procedere:</b><br/>"
        "• <b>Accesso:</b> Inserisci il tuo Identificativo Utenza (es. <code>m.rossi</code>) e la tua Password fornita dalla Direzione.<br/>"
        "• <b>Nuova Richiesta:</b> Tocca il pulsante blu <b>'+ Nuova Richiesta'</b> in alto.<br/>"
        "• <b>Scegli la Tipologia:</b><br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;1. <b>Ferie Intera:</b> seleziona uno o più giorni continuativi sul mini calendario.<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;2. <b>Permesso Orario:</b> specifica quante ore libere ti occorrono per il giorno indicato.<br/>"
        "&nbsp;&nbsp;&nbsp;&nbsp;3. <b>Malattia:</b> registra l'assenza e inserisci il <b>Numero di Protocollo INPS</b> (puoi aggiungerlo anche successivamente).<br/>"
        "• <b>Invio:</b> Tocca <b>'Invia Richiesta al Titolare'</b>. Riceverai conferma non appena la Direzione convalida la richiesta."
    )
    story.append(Paragraph(istruzioni, stili['Corpo']))
    
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Generato {filename}")

# -------------------------------------------------------------
# 2. GUIDA DIPENDENTI APPLE iOS (IPHONE / IPAD)
# -------------------------------------------------------------
def genera_guida_ios(stili):
    filename = "GUIDA_DIPENDENTI_IOS_IPHONE.pdf"
    doc = SimpleDocTemplate(filename, pagesize=A4, leftMargin=40, rightMargin=40, topMargin=35, bottomMargin=45)
    story = []
    
    story.extend(crea_header_aziendale(
        stili,
        "Guida Dipendente: Accesso & Uso su iPhone (iOS)",
        "Procedura illustrata da Safari per aggiungere l'icona alla Home e gestire assenze, ferie e malattia."
    ))
    
    story.append(crea_box_evidenza(
        "<b>FUNZIONALITÀ PER IPHONE:</b><br/>"
        "Su dispositivi Apple iOS (iPhone e iPad) la procedura ideale non richiede l'App Store: utilizzando il browser nativo <b>Safari</b> "
        "puoi aggiungere l'icona direttamente sulla schermata Home. L'app si aprirà a schermo intero come un'applicazione ufficiale Apple, "
        "senza barre di navigazione e con prestazioni istantanee.",
        stili, colore_bordo="#2563eb", colore_sfondo="#eff6ff"
    ))
    story.append(Spacer(1, 10))
    
    story.append(Paragraph("1. Come Aggiungere l'Icona alla Schermata Home di iPhone", stili['SezioneTitolo']))
    
    img_ios = 'guide_risorse/passaggi_ios.png'
    if os.path.exists(img_ios):
        story.append(Image(img_ios, width=515, height=206))
        story.append(Spacer(1, 10))
        
    passaggi_ios = [
        ("Passo 1", f"Apri <b>Safari</b> (icona bussola) e vai all'indirizzo:<br/><font color='#2563eb'><b>{URL_PORTALE}</b></font>"),
        ("Passo 2", "In basso al centro dello schermo, tocca il pulsante <b>Condividi</b> (l'icona quadrata con la freccia che punta verso l'alto)."),
        ("Passo 3", "Nel menu che compare, scorri verso il basso e tocca la voce: <b>'Aggiungi alla schermata Home'</b> (con icona quadrata col simbolo +)."),
        ("Passo 4", "In alto a destra tocca <b>'Aggiungi'</b>. L'icona con il logo C. Emme Impianti comparirà sulla schermata principale del tuo iPhone, pronta da aprire!")
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
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t)
    story.append(Spacer(1, 14))
    
    story.append(Paragraph("2. Utilizzo Quotidiano e Notifiche", stili['SezioneTitolo']))
    
    scr_dash = 'guide_risorse/schermata_dashboard.png'
    if os.path.exists(scr_dash):
        story.append(Image(scr_dash, width=515, height=240))
        story.append(Spacer(1, 8))
        
    testo_uso = (
        "<b>Funzionalità principali per il collaboratore:</b><br/>"
        "• <b>Pannello Personale:</b> Nella parte superiore puoi monitorare in tempo reale i giorni di <i>Ferie Godute</i>, "
        "le ore di <i>Permessi Orari</i> fruiti, i giorni di <i>Malattia</i> registrati e le richieste <i>In attesa di conferma</i>.<br/>"
        "• <b>Calendario Interattivo:</b> Visualizza il mese corrente e naviga tra i mesi con le frecce per controllare le tue assenze approvate in azzurro.<br/>"
        "• <b>Storico Personale:</b> Nella scheda <i>'Il Tuo Storico Personale'</i> puoi consultare l'elenco completo di tutte le richieste inoltrate e lo stato.<br/>"
        "• <b>Notifiche Direzione:</b> Se la Direzione revoca un'assenza per sopraggiunte esigenze di cantiere o comunica una Chiusura Aziendale, "
        "vedrai comparire un avviso in cima allo schermo con la motivazione dettagliata."
    )
    story.append(Paragraph(testo_uso, stili['Corpo']))
    
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Generato {filename}")

# -------------------------------------------------------------
# 3. GUIDA UNIFICATA DIPENDENTI (ANDROID + IOS)
# -------------------------------------------------------------
def genera_guida_unificata(stili):
    filename = "GUIDA_UNIFICATA_DIPENDENTI_SMARTPHONE.pdf"
    doc = SimpleDocTemplate(filename, pagesize=A4, leftMargin=40, rightMargin=40, topMargin=35, bottomMargin=45)
    story = []
    
    story.extend(crea_header_aziendale(
        stili,
        "Manuale Dipendenti: Accesso Mobile (Android & iOS)",
        "Guida completa per installare l'icona sulla Home su qualsiasi smartphone e gestire le proprie assenze."
    ))
    
    story.append(crea_box_evidenza(
        f"<b>INDIRIZZO DEL PORTALE AZIENDALE:</b> <font color='#2563eb'><b>{URL_PORTALE}</b></font><br/>"
        "Il portale è attivo 24 ore su 24 ed è accessibile da qualsiasi smartphone. Non è necessario scaricare file pesanti: "
        "basta creare il segnalibro sulla schermata Home seguendo le istruzioni relative al tuo telefono (Android o iPhone).",
        stili, colore_bordo="#1e3a8a", colore_sfondo="#f8fafc"
    ))
    story.append(Spacer(1, 10))
    
    # SEZIONE 1: METODO APPLE IOS
    story.append(Paragraph("A) Per chi possiede un APPLE iPhone (iOS)", stili['SezioneTitolo']))
    img_ios = 'guide_risorse/passaggi_ios.png'
    if os.path.exists(img_ios):
        story.append(Image(img_ios, width=515, height=195))
        story.append(Spacer(1, 6))
        
    passi_ios_txt = (
        "<b>1.</b> Apri <b>Safari</b> e visita il link del portale.<br/>"
        "<b>2.</b> Tocca in basso l'icona <b>Condividi</b> (quadrato con freccia verso l'alto).<br/>"
        "<b>3.</b> Scorri l'elenco e tocca <b>'Aggiungi alla schermata Home'</b>.<br/>"
        "<b>4.</b> Tocca <b>'Aggiungi'</b> in alto a destra: troverai l'icona Cemme sul desktop del tuo iPhone."
    )
    story.append(Paragraph(passi_ios_txt, stili['Corpo']))
    story.append(Spacer(1, 12))
    
    # SEZIONE 2: METODO ANDROID
    story.append(Paragraph("B) Per chi possiede uno smartphone ANDROID (Samsung, Xiaomi, Pixel...)", stili['SezioneTitolo']))
    img_android = 'guide_risorse/passaggi_android.png'
    if os.path.exists(img_android):
        story.append(Image(img_android, width=515, height=195))
        story.append(Spacer(1, 6))
        
    passi_android_txt = (
        "<b>1.</b> Apri <b>Google Chrome</b> e naviga all'indirizzo del portale.<br/>"
        "<b>2.</b> Tocca il banner che compare in basso: <b>'Aggiungi a schermata Home'</b> "
        "(oppure tocca i <b>3 puntini</b> in alto a destra e seleziona <i>'Installa applicazione'</i>).<br/>"
        "<b>3.</b> Premi <b>'Installa'</b>: l'app viene creata automaticamente senza avvisi di sicurezza né blocchi."
    )
    story.append(Paragraph(passi_android_txt, stili['Corpo']))
    
    story.append(PageBreak()) # Pagina 2 per le istruzioni d'uso
    
    story.append(Paragraph("Come Utilizzare il Portale: Invio e Gestione Assenze", stili['SezioneTitolo']))
    
    scr_richiesta = 'guide_risorse/schermata_richiesta.png'
    if os.path.exists(scr_richiesta):
        story.append(Image(scr_richiesta, width=515, height=270))
        story.append(Spacer(1, 10))
        
    dettaglio_funzioni = [
        ("Ferie a Giornata", "Seleziona uno o più giorni sul calendario. Il sistema calcola in automatico le giornate lavorative reali (escludendo sabati, domeniche e festività)."),
        ("Permessi Orari (ROL)", "Permette di scegliere quante ore assentarsi (es. 1h, 2h, 4h o a scelta libera) per visite mediche o esigenze personali."),
        ("Malattia & Protocollo", "Registra i giorni di assenza per malattia e consente di inserire il Numero di Protocollo INPS (anche successivamente alla richiesta)."),
        ("Notifiche e Revoche", "Se la Direzione approva o revoca una richiesta con motivazione, compare un avviso ben visibile all'apertura del portale.")
    ]
    
    tab_funz = []
    for tit, desc in dettaglio_funzioni:
        p_t = Paragraph(f"<b>{tit}</b>", stili['CorpoGrassetto'])
        p_d = Paragraph(desc, stili['Corpo'])
        tab_funz.append([p_t, p_d])
        
    t = Table(tab_funz, colWidths=[150, 365])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f8fafc')),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))
    story.append(t)
    
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Generato {filename}")

# -------------------------------------------------------------
# 4. MANUALE OPERATIVO COMPLETO TITOLARE / DIREZIONE
# -------------------------------------------------------------
def genera_manuale_titolare(stili):
    filename = "MANUALE_OPERATIVO_TITOLARE.pdf"
    doc = SimpleDocTemplate(filename, pagesize=A4, leftMargin=40, rightMargin=40, topMargin=35, bottomMargin=45)
    story = []
    
    story.extend(crea_header_aziendale(
        stili,
        "Manuale Operativo Direzione: Gestione Ferie & Personale",
        "Documento riservato al Titolare per l'amministrazione completa delle utenze, approvazioni, revoche e chiusure aziendali."
    ))
    
    story.append(crea_box_evidenza(
        "<b>ACCESSO RISERVATO ALLA DIREZIONE GENERALE:</b><br/>"
        "• <b>Identificativo Utenza:</b> <code>titolare</code><br/>"
        "• <b>Chiave d'Accesso (Password iniziale):</b> <code>cemme2026</code><br/>"
        "Con questa utenza il Titolare dispone dei massimi privilegi di gestione, supervisione e sovrascrittura.",
        stili, colore_bordo="#b45309", colore_sfondo="#fffbeb"
    ))
    story.append(Spacer(1, 10))
    
    # 1. GESTIONE UTENZE
    story.append(Paragraph("1. Gestione Utenze Aziendali (Dipendenti e Responsabili)", stili['SezioneTitolo']))
    scr_utenze = 'guide_risorse/schermata_utenze.png'
    if os.path.exists(scr_utenze):
        story.append(Image(scr_utenze, width=515, height=270))
        story.append(Spacer(1, 8))
        
    testo_utenze = (
        "Dalla barra in alto cliccando su <b>'Gestione Utenze'</b> il Titolare può:<br/>"
        "• <b>Creare Nuove Utenze:</b> Inserire ID (es. <code>m.rossi</code>), Nome e Cognome, Password, Reparto e Telefono.<br/>"
        "• <b>Assegnare il Ruolo di Responsabile:</b> Spuntando la casella <i>'Utenza con ruolo di Responsabile'</i>, "
        "l'utente creato potrà validare e approvare le ferie dei colleghi, ma le sue personali richieste dovranno essere autorizzate esclusivamente dal Titolare.<br/>"
        "• <b>Modifica Password ed Eliminazione:</b> Modificare le password dei dipendenti in caso di smarrimento o eliminare utenze dismesse."
    )
    story.append(Paragraph(testo_utenze, stili['Corpo']))
    
    story.append(PageBreak()) # Pagina 2
    
    # 2. APPROVAZIONI E CALENDARIO CON NOMI
    story.append(Paragraph("2. Supervisione Calendario & Nomi Dipendenti", stili['SezioneTitolo']))
    testo_cal = (
        "A differenza della schermata del dipendente, il Titolare visualizza direttamente in ogni casella giornaliera il "
        "<b>nominativo della persona assente</b> con badge identificativo a colori:<br/>"
        "• <code>👤 Mario Rossi (Ferie)</code> in azzurro.<br/>"
        "• <code>🩺 Giuseppe Verdi (Malattia)</code> in verde smeraldo.<br/>"
        "• <code>⏰ Antonio N. (4h)</code> in viola.<br/>"
        "• <code>⏳ Collaboratore (In attesa)</code> in ambra (richiesta da convalidare)."
    )
    story.append(Paragraph(testo_cal, stili['Corpo']))
    story.append(Spacer(1, 8))
    
    # 3. INSERIMENTO FERIE PER I DIPENDENTI
    story.append(Paragraph("3. Inserimento Ferie Diretto per Conto dei Dipendenti", stili['SezioneTitolo']))
    testo_ins = (
        "Il Titolare può inserire ferie, permessi o malattia direttamente a nome di qualsiasi collaboratore:<br/>"
        "• Cliccando su <b>'Nuova Richiesta'</b>, compare il menu a tendina <i>'Richiedi per conto di'</i>.<br/>"
        "• Le assenze registrate dal Titolare per un dipendente vengono <b>approvate d'ufficio all'istante</b> "
        "senza dover passare per la fase di convalida."
    )
    story.append(Paragraph(testo_ins, stili['Corpo']))
    story.append(Spacer(1, 8))
    
    # 4. REVOCA DELLE FERIE
    story.append(Paragraph("4. Revoca Ferie Approvate con Motivazione e Notifica", stili['SezioneTitolo']))
    testo_revoca = (
        "Qualora per sopraggiunte esigenze di cantiere ferroviario sia necessario revocare ferie già accordate:<br/>"
        "1. Clicca sulla giornata a calendario o sulla richiesta nello Storico Assenze.<br/>"
        "2. Premi il pulsante rosso <b>'Revoca Ferie & Notifica Dipendente'</b>.<br/>"
        "3. Inserisci la causale formale (es. <i>'Esigenze improcrastinabili presidio cantiere'</i>).<br/>"
        "4. Le ferie vengono revocate liberando i giorni e il dipendente riceve istantaneamente una notifica in bacheca."
    )
    story.append(Paragraph(testo_revoca, stili['Corpo']))
    story.append(Spacer(1, 8))
    
    # 5. CHIUSURA AZIENDALE COLLETTIVA
    story.append(Paragraph("5. Programmazione Chiusura Aziendale Collettiva", stili['SezioneTitolo']))
    testo_chiusura = (
        "Dall'apposito pulsante <b>'Chiusura Aziendale'</b> nella barra di navigazione:<br/>"
        "• Il Titolare può stabilire periodi di chiusura per tutti i reparti (es. Ferie Estive o Chiusura Festività Natalizie).<br/>"
        "• Il sistema calcola automaticamente i soli giorni lavorativi e applica il blocco a tutto il personale in un colpo solo.<br/>"
        "• I dipendenti ricevono notifica automatica del periodo di chiusura."
    )
    story.append(Paragraph(testo_chiusura, stili['Corpo']))
    story.append(Spacer(1, 8))
    
    # 6. STORICO GENERALE E PERSONA PER PERSONA
    story.append(Paragraph("6. Storico Generale e Filtro Collaboratori", stili['SezioneTitolo']))
    testo_storico = (
        "Nella sezione <b>'Storico Assenze'</b>, il Titolare dispone di un menu di selezione collaboratori: "
        "può esaminare il registro globale oppure filtrare persona per persona per verificare esattamente quante ferie, "
        "permessi e malattie ha usufruito ciascun dipendente durante l'anno solare."
    )
    story.append(Paragraph(testo_storico, stili['Corpo']))
    
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"Generato {filename}")

if __name__ == '__main__':
    stili = crea_stili()
    genera_guida_android(stili)
    genera_guida_ios(stili)
    genera_guida_unificata(stili)
    genera_manuale_titolare(stili)
    print("Tutti i 4 PDF sono stati creati con successo!")
