import os
from PIL import Image, ImageDraw, ImageFont

os.makedirs('guide_risorse', exist_ok=True)

def get_font(size, bold=False):
    # Prova a caricare font standard di sistema Windows
    font_paths = [
        r"C:\Windows\Fonts\arialbd.ttf" if bold else r"C:\Windows\Fonts\arial.ttf",
        r"C:\Windows\Fonts\segoeuib.ttf" if bold else r"C:\Windows\Fonts\segoeui.ttf",
        r"C:\Windows\Fonts\calibrib.ttf" if bold else r"C:\Windows\Fonts\calibri.ttf"
    ]
    for path in font_paths:
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size)
            except Exception:
                pass
    return ImageFont.load_default()

def crea_grafica_ios():
    w, h = 900, 360
    img = Image.new('RGB', (w, h), color='#f8fafc')
    draw = ImageDraw.Draw(img)
    
    # Bordo e titolo
    draw.rectangle([10, 10, w-10, h-10], fill='#ffffff', outline='#cbd5e1', width=2)
    draw.rectangle([10, 10, w-10, 60], fill='#1e3a8a')
    
    font_titolo = get_font(22, bold=True)
    font_step_num = get_font(18, bold=True)
    font_step_title = get_font(15, bold=True)
    font_step_desc = get_font(13, bold=False)
    
    draw.text((25, 20), "PROCEDURA INSTALLAZIONE SU APPLE iOS (iPhone & iPad)", fill='#ffffff', font=font_titolo)
    
    # 4 Passaggi a schede
    box_w = 205
    box_gap = 12
    start_x = 22
    y_top = 80
    box_h = 250
    
    steps = [
        ("1. APRI SAFARI", "Accedi al link su Safari:\nferie-cemme.askreddit098.workers.dev", "#2563eb", "Icona Safari"),
        ("2. CONDIVIDI", "Tocca in basso l'icona\nCondividi\n(Quadrato con freccia in su)", "#0284c7", "Tasto Condividi"),
        ("3. AGGIUNGI", "Scorri l'elenco e tocca:\n'Aggiungi alla\nschermata Home'", "#0d9488", "Aggiungi a Home"),
        ("4. CONFERMA", "Tocca 'Aggiungi' in alto a dx.\nL'icona Cemme comparirà\nsul tuo schermo!", "#16a34a", "App Pronta")
    ]
    
    for i, (titolo, desc, col, badge) in enumerate(steps):
        bx = start_x + i * (box_w + box_gap)
        # Sfondo scheda
        draw.rectangle([bx, y_top, bx+box_w, y_top+box_h], fill='#f1f5f9', outline='#cbd5e1', width=1)
        # Intestazione scheda
        draw.rectangle([bx, y_top, bx+box_w, y_top+45], fill=col)
        draw.text((bx+12, y_top+12), titolo, fill='#ffffff', font=font_step_num)
        
        # Testo descrittivo
        draw.text((bx+12, y_top+60), desc, fill='#1e293b', font=font_step_desc, spacing=6)
        
        # Badge in basso
        draw.rectangle([bx+12, y_top+box_h-40, bx+box_w-12, y_top+box_h-12], fill='#ffffff', outline=col, width=1)
        draw.text((bx+20, y_top+box_h-32), badge, fill=col, font=font_step_title)
        
    img.save('guide_risorse/passaggi_ios.png')
    print("Salvato passaggi_ios.png")

def crea_grafica_android():
    w, h = 900, 360
    img = Image.new('RGB', (w, h), color='#f8fafc')
    draw = ImageDraw.Draw(img)
    
    draw.rectangle([10, 10, w-10, h-10], fill='#ffffff', outline='#cbd5e1', width=2)
    draw.rectangle([10, 10, w-10, 60], fill='#047857')
    
    font_titolo = get_font(22, bold=True)
    font_step_num = get_font(18, bold=True)
    font_step_title = get_font(15, bold=True)
    font_step_desc = get_font(13, bold=False)
    
    draw.text((25, 20), "PROCEDURA INSTALLAZIONE SU SMARTPHONE ANDROID", fill='#ffffff', font=font_titolo)
    
    box_w = 270
    box_gap = 20
    start_x = 35
    y_top = 80
    box_h = 250
    
    steps = [
        ("1. APRI CHROME", "Apri Google Chrome e inserisci:\nferie-cemme.askreddit098.workers.dev", "#059669", "Google Chrome"),
        ("2. TOCCO INSTALLA", "Tocca il banner in basso:\n'Aggiungi a schermata Home'\no i 3 puntini in alto a dx", "#0284c7", "Banner / 3 Puntini"),
        ("3. CONFERMA RAPIDA", "Conferma toccando 'Installa'.\nL'app aziendale apparirà tra\nle applicazioni del telefono!", "#16a34a", "Icona Attiva")
    ]
    
    for i, (titolo, desc, col, badge) in enumerate(steps):
        bx = start_x + i * (box_w + box_gap)
        draw.rectangle([bx, y_top, bx+box_w, y_top+box_h], fill='#f1f5f9', outline='#cbd5e1', width=1)
        draw.rectangle([bx, y_top, bx+box_w, y_top+45], fill=col)
        draw.text((bx+15, y_top+12), titolo, fill='#ffffff', font=font_step_num)
        
        draw.text((bx+15, y_top+65), desc, fill='#1e293b', font=font_step_desc, spacing=8)
        
        draw.rectangle([bx+15, y_top+box_h-45, bx+box_w-15, y_top+box_h-12], fill='#ffffff', outline=col, width=1)
        draw.text((bx+25, y_top+box_h-34), badge, fill=col, font=font_step_title)
        
    img.save('guide_risorse/passaggi_android.png')
    print("Salvato passaggi_android.png")

crea_grafica_ios()
crea_grafica_android()
