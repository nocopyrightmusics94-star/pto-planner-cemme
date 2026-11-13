import os
from PIL import Image, ImageDraw, ImageFont

os.makedirs('guide_risorse', exist_ok=True)

def get_font(size, bold=False):
    # Font di sistema Windows
    font_paths = [
        r"C:\Windows\Fonts\segoeuib.ttf" if bold else r"C:\Windows\Fonts\segoeui.ttf",
        r"C:\Windows\Fonts\arialbd.ttf" if bold else r"C:\Windows\Fonts\arial.ttf",
        r"C:\Windows\Fonts\calibrib.ttf" if bold else r"C:\Windows\Fonts\calibri.ttf"
    ]
    for path in font_paths:
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size)
            except Exception:
                pass
    return ImageFont.load_default()

def crea_mockup_modale_retina():
    # Risoluzione 2X Retina (1800x1120 px) per nitidezza assoluta nei PDF
    W, H = 1800, 1120
    img = Image.new('RGB', (W, H), color='#ffffff')
    draw = ImageDraw.Draw(img)

    f_titolo = get_font(34, bold=True)
    f_sub = get_font(21, bold=False)
    f_sez = get_font(21, bold=True)
    f_card_t = get_font(25, bold=True)
    f_card_sub = get_font(18, bold=False)
    f_cal_head = get_font(24, bold=True)
    f_cal_day = get_font(20, bold=True)
    f_cal_num = get_font(22, bold=False)
    f_cal_num_b = get_font(22, bold=True)
    f_btn = get_font(23, bold=True)
    f_note = get_font(20, bold=False)
    f_badge_t = get_font(18, bold=True)

    # Bordo esterno della finestra con ombra sottile
    draw.rounded_rectangle([20, 20, W-20, H-20], radius=24, fill='#ffffff', outline='#cbd5e1', width=3)

    # 1. Barra Superiore Modale (Header Scuro elegante)
    draw.rounded_rectangle([20, 20, W-20, 130], radius=24, fill='#0f172a')
    draw.rectangle([20, 80, W-20, 130], fill='#0f172a')
    
    # Icona quadrata blu
    draw.rounded_rectangle([50, 42, 115, 107], radius=14, fill='#2563eb')
    draw.text((65, 48), "📅", font=get_font(34))
    
    draw.text((135, 40), "Nuova Richiesta di Assenza", fill='#ffffff', font=f_titolo)
    draw.text((135, 84), "Ferie, Permessi Orari e Malattia — C. Emme Impianti S.r.l.", fill='#94a3b8', font=f_sub)
    draw.text((W-90, 52), "✕", fill='#94a3b8', font=get_font(34, bold=True))

    # 2. Sezione: TIPOLOGIA DI ASSENZA (Le 3 tipologie reali del portale)
    draw.text((55, 160), "TIPOLOGIA DI ASSENZA", fill='#334155', font=f_sez)
    
    schede = [
        ("Ferie Intera", "Giornata intera o più giorni", "#2563eb", True, "🌴"),
        ("Permesso Orario", "A ore libere (da 1h a 8h)", "#7c3aed", False, "⏰"),
        ("Malattia", "Con numero protocollo INPS", "#059669", False, "🩺")
    ]
    
    card_w = 540
    gap = 35
    start_x = 55
    y_card = 200
    card_h = 125
    
    for i, (titolo, sottotitolo, col, attiva, icona) in enumerate(schede):
        cx = start_x + i * (card_w + gap)
        if attiva:
            draw.rounded_rectangle([cx, y_card, cx+card_w, y_card+card_h], radius=16, fill='#eff6ff', outline='#2563eb', width=4)
            draw.text((cx+28, y_card+25), icona, font=get_font(42))
            draw.text((cx+100, y_card+26), titolo, fill='#1d4ed8', font=f_card_t)
            draw.text((cx+100, y_card+70), sottotitolo, fill='#3b82f6', font=f_card_sub)
        else:
            draw.rounded_rectangle([cx, y_card, cx+card_w, y_card+card_h], radius=16, fill='#ffffff', outline='#e2e8f0', width=2)
            draw.text((cx+28, y_card+25), icona, font=get_font(42))
            draw.text((cx+100, y_card+26), titolo, fill='#334155', font=f_card_t)
            draw.text((cx+100, y_card+70), sottotitolo, fill='#64748b', font=f_card_sub)

    # 3. Layout a 2 Colonne perfettamente bilanciate
    y_body = 360
    
    # --- COLONNA SINISTRA: MINI CALENDARIO ---
    draw.text((55, y_body), "SELEZIONA LE DATE SUL MINI CALENDARIO", fill='#334155', font=f_sez)
    
    cal_box = [55, y_body+40, 920, y_body+560]
    draw.rounded_rectangle(cal_box, radius=16, fill='#ffffff', outline='#cbd5e1', width=2)
    
    # Intestazione Mese
    draw.text((90, y_body+65), "Novembre 2026", fill='#0f172a', font=f_cal_head)
    draw.text((800, y_body+65), "◀   ▶", fill='#475569', font=f_cal_head)
    
    # Giorni settimana
    giorni = ["LUN", "MAR", "MER", "GIO", "VEN", "SAB", "DOM"]
    gw = 112
    gy = y_body+120
    for idx, g in enumerate(giorni):
        col_g = '#ef4444' if idx == 6 else '#64748b'
        draw.text((90 + idx*gw, gy), g, fill=col_g, font=f_cal_day)
        
    num_y = gy + 45
    # Riga 1 (1 Novembre Domenica festivo)
    draw.text((90 + 6*gw, num_y), "1", fill='#ef4444', font=f_cal_num)
    
    # Riga 2 (2, 3, 4, 5, 6, 7, 8)
    num_y += 52
    draw.text((90 + 0*gw, num_y), "2", fill='#1e293b', font=f_cal_num)
    
    # Intervallo selezionato: 3, 4, 5 Novembre con pill blu evidenziata
    draw.rounded_rectangle([90 + 1*gw - 16, num_y - 8, 90 + 3*gw + 45, num_y + 40], radius=14, fill='#2563eb')
    draw.text((90 + 1*gw, num_y), "3", fill='#ffffff', font=f_cal_num_b)
    draw.text((90 + 2*gw, num_y), "4", fill='#ffffff', font=f_cal_num_b)
    draw.text((90 + 3*gw, num_y), "5", fill='#ffffff', font=f_cal_num_b)
    
    draw.text((90 + 4*gw, num_y), "6", fill='#1e293b', font=f_cal_num)
    draw.text((90 + 5*gw, num_y), "7", fill='#94a3b8', font=f_cal_num)
    draw.text((90 + 6*gw, num_y), "8", fill='#ef4444', font=f_cal_num)
    
    # Riga 3
    num_y += 52
    for d in range(9, 16):
        col_n = '#ef4444' if d == 15 else ('#94a3b8' if d == 14 else '#1e293b')
        draw.text((90 + (d-9)*gw, num_y), str(d), fill=col_n, font=f_cal_num)
        
    # Riga 4
    num_y += 52
    for d in range(16, 23):
        col_n = '#ef4444' if d == 22 else ('#94a3b8' if d == 21 else '#1e293b')
        draw.text((90 + (d-16)*gw, num_y), str(d), fill=col_n, font=f_cal_num)
        
    # Riga 5
    num_y += 52
    for d in range(23, 30):
        col_n = '#ef4444' if d == 29 else ('#94a3b8' if d == 28 else '#1e293b')
        draw.text((90 + (d-23)*gw, num_y), str(d), fill=col_n, font=f_cal_num)
        
    # Testo intervallo selezionato
    draw.rounded_rectangle([80, y_body+495, 895, y_body+540], radius=8, fill='#eff6ff')
    draw.text((150, y_body+506), "✓ Intervallo selezionato: dal 2026-11-03 al 2026-11-05 (3 giorni)", fill='#1d4ed8', font=f_badge_t)

    # --- COLONNA DESTRA: RIEPILOGO, NOTE & AZIONI ---
    cx_dx = 970
    draw.text((cx_dx, y_body), "RIEPILOGO DELLA RICHIESTA", fill='#334155', font=f_sez)
    
    # Box Riepilogo
    draw.rounded_rectangle([cx_dx, y_body+40, W-55, y_body+190], radius=16, fill='#f8fafc', outline='#cbd5e1', width=2)
    
    draw.text((cx_dx+30, y_body+65), "DURATA ASSENZA", fill='#64748b', font=f_card_sub)
    draw.text((cx_dx+30, y_body+95), "3 giornate lavorative", fill='#0f172a', font=get_font(26, bold=True))
    draw.text((cx_dx+30, y_body+135), "(3 giorni di ferie continuativi)", fill='#2563eb', font=f_card_sub)
    
    draw.text((cx_dx+400, y_body+65), "PERIODO CALCOLATO", fill='#64748b', font=f_card_sub)
    draw.text((cx_dx+400, y_body+95), "2026-11-03 → 2026-11-05", fill='#0f172a', font=get_font(23, bold=True))
    draw.text((cx_dx+400, y_body+135), "Esclusi sabati e domeniche", fill='#64748b', font=f_card_sub)
    
    # Campo Note
    draw.text((cx_dx, y_body+220), "NOTE O MOTIVAZIONE (FACOLTATIVA)", fill='#334155', font=f_sez)
    draw.rounded_rectangle([cx_dx, y_body+260, W-55, y_body+430], radius=14, fill='#ffffff', outline='#cbd5e1', width=2)
    draw.text((cx_dx+25, y_body+285), "es. Ferie programmate per riposo stagionale...", fill='#94a3b8', font=f_note)
    
    # Sezione Informazioni Utili
    draw.rounded_rectangle([cx_dx, y_body+455, W-55, y_body+560], radius=12, fill='#f0fdf4', outline='#86efac', width=1)
    draw.text((cx_dx+20, y_body+475), "💡 Nota per il collaboratore:", fill='#166534', font=get_font(18, bold=True))
    draw.text((cx_dx+20, y_body+505), "La richiesta verrà notificata direttamente alla Direzione.\nRiceverai conferma non appena convalidata.", fill='#15803d', font=f_card_sub)

    # 4. Barra Azioni Inferiore (Pulsanti)
    draw.line([55, H-120, W-55, H-120], fill='#e2e8f0', width=2)
    
    draw.text((cx_dx+110, H-75), "Annulla", fill='#64748b', font=f_btn)
    
    # Pulsante Invia Richiesta
    draw.rounded_rectangle([cx_dx+260, H-95, W-55, H-35], radius=12, fill='#2563eb')
    draw.text((cx_dx+310, H-73), "✈  Invia Richiesta al Titolare", fill='#ffffff', font=f_btn)

    output_path = 'guide_risorse/mockup_richiesta_hd.png'
    img.save(output_path, quality=98)
    print(f"Creato mockup HD Retina: {output_path} ({W}x{H}, aspect: {W/H:.2f})")

if __name__ == '__main__':
    crea_mockup_modale_retina()
