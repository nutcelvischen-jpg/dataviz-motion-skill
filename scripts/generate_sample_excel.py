import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side

wb = openpyxl.Workbook()
# Remove default sheet
wb.remove(wb.active)

# Helper styles
header_font = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
header_fill = PatternFill(start_color="1E293B", end_color="1E293B", fill_type="solid")
accent_header_fill = PatternFill(start_color="FF5722", end_color="FF5722", fill_type="solid")
thin_border = Border(
    left=Side(style='thin', color='E2E8F0'),
    right=Side(style='thin', color='E2E8F0'),
    top=Side(style='thin', color='E2E8F0'),
    bottom=Side(style='thin', color='E2E8F0')
)

def style_sheet(ws, title, headers, data):
    ws.title = title
    ws.views.sheetView[0].showGridLines = True
    
    # Headers
    ws.append(headers)
    for col_idx, cell in enumerate(ws[1], 1):
        cell.font = header_font
        cell.fill = accent_header_fill if col_idx == 1 else header_fill
        cell.alignment = Alignment(horizontal="center", vertical="center")
    
    # Rows
    for row in data:
        ws.append(row)
        
    for row in ws.iter_rows(min_row=2, max_row=len(data)+1, min_col=1, max_col=len(headers)):
        for cell in row:
            cell.border = thin_border
            if isinstance(cell.value, (int, float)):
                cell.alignment = Alignment(horizontal="right")
            else:
                cell.alignment = Alignment(horizontal="left")
                
    # Auto column width
    for col in ws.columns:
        max_len = max(len(str(cell.value or '')) for cell in col)
        col_letter = openpyxl.utils.get_column_letter(col[0].column)
        ws.column_dimensions[col_letter].width = max(max_len + 5, 14)

# 1. 產品線離散體量
ws1 = wb.create_sheet()
headers1 = ["產品線", "類別", "本季營收(萬元)", "目標營收(萬元)", "毛利率(%)", "客戶數"]
data1 = [
    ["企業雲平台", "SaaS服務", 940, 800, 78.5, 342],
    ["智能數據中台", "數據產品", 720, 650, 71.2, 218],
    ["AI視覺助理", "前沿AI", 580, 500, 65.0, 154],
    ["物聯網邊緣節點", "硬體方案", 430, 450, 48.2, 98],
    ["資訊安全套件", "基礎架構", 360, 320, 82.0, 185],
    ["行動端SDK", "開發者工具", 290, 300, 62.4, 420],
    ["私有化部署模組", "交付服務", 210, 250, 52.8, 45],
    ["技術諮詢服務", "專業服務", 160, 150, 45.0, 32]
]
style_sheet(ws1, "產品營收體量", headers1, data1)

# 2. 時序月度趨勢
ws2 = wb.create_sheet()
headers2 = ["月份", "總營收(萬元)", "訂單總數", "新增付費用戶", "伺服器成本(萬元)"]
data2 = [
    ["2024-01", 312, 1240, 340, 45],
    ["2024-02", 345, 1310, 385, 48],
    ["2024-03", 390, 1450, 420, 52],
    ["2024-04", 425, 1520, 465, 55],
    ["2024-05", 480, 1680, 510, 60],
    ["2024-06", 530, 1820, 590, 64],
    ["2024-07", 595, 2010, 650, 68],
    ["2024-08", 660, 2190, 720, 72],
    ["2024-09", 740, 2430, 810, 78],
    ["2024-10", 815, 2650, 895, 84],
    ["2024-11", 890, 2920, 970, 91],
    ["2024-12", 985, 3250, 1080, 98]
]
style_sheet(ws2, "時序月度趨勢", headers2, data2)

# 3. 行銷廣告與獲客相關
ws3 = wb.create_sheet()
headers3 = ["宣傳管道", "廣告預算(千元)", "新增轉化用戶", "獲客成本CPA(元)", "總銷售額(萬元)"]
data3 = [
    ["Google 關鍵字搜尋", 45, 1120, 40.2, 168],
    ["Meta 社交動態廣告", 38, 890, 42.7, 134],
    ["YouTube 影音聯播", 52, 980, 53.1, 152],
    ["LinkedIn 專業受眾", 28, 420, 66.7, 115],
    ["KOL 評測推薦 (爆款)", 65, 1950, 33.3, 310],  # 亮眼離群高轉化
    ["線下技術研討會", 30, 380, 78.9, 98],
    ["內容行銷 SEO", 15, 620, 24.2, 92],
    ["電子報 EDM", 8, 260, 30.8, 38],
    ["聯盟行銷分潤", 22, 540, 40.7, 85],
    ["戶外看板廣告 (低效)", 50, 280, 178.6, 42]   # 異常離群低效點
]
style_sheet(ws3, "行銷投入與轉化相關", headers3, data3)

# 4. 業務營收結構佔比
ws4 = wb.create_sheet()
headers4 = ["業務板塊", "市場規模(億元)", "板塊份額(%)", "年增長率(%)", "戰略等級"]
data4 = [
    ["企業核心雲", 42.8, 44.5, 38.2, "核心主力"],
    ["智慧製造AI", 24.5, 25.5, 52.4, "高增長明星"],
    ["金融風控系統", 15.6, 16.2, 28.5, "穩定金牛"],
    ["醫療大數據", 8.9, 9.3, 64.1, "戰略孵化"],
    ["零售客流分析", 4.3, 4.5, 12.0, "邊緣探索"]
]
style_sheet(ws4, "業務結構佔比", headers4, data4)

# 5. 團隊綜合多維畫像
ws5 = wb.create_sheet()
headers5 = ["評估維度", "實際達成得分", "標準基準線", "去年同期得分", "目標滿分"]
data5 = [
    ["程式碼品質", 94, 85, 82, 100],
    ["系統穩定性", 98, 90, 88, 100],
    ["迭代交付速度", 88, 80, 74, 100],
    ["安全與合規", 96, 85, 90, 100],
    ["架構擴展性", 84, 75, 70, 100],
    ["團隊人效比", 91, 80, 76, 100]
]
style_sheet(ws5, "團隊多維畫像", headers5, data5)

# 6. 電商全鏈路轉化漏斗
ws6 = wb.create_sheet()
headers6 = ["漏斗階段", "觸達用戶數", "絕對轉化率(%)", "階段流失率(%)", "耗時中位數(秒)"]
data6 = [
    ["01_首頁登錄", 100000, 100.0, 0.0, 12],
    ["02_瀏覽商品列表", 68500, 68.5, 31.5, 45],
    ["03_進入產品詳情頁", 38200, 38.2, 44.2, 92],
    ["04_加入購物車", 19600, 19.6, 48.7, 34],
    ["05_進入結帳收銀台", 14800, 14.8, 24.5, 68],
    ["06_完成最終支付", 10200, 10.2, 31.1, 28]
]
style_sheet(ws6, "電商轉化漏斗", headers6, data6)

output_path = "sample_data/商業數據全分析範例.xlsx"
wb.save(output_path)
print(f"Sample Excel saved to {output_path}")
