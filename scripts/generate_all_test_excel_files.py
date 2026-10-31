import os
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

SAMPLE_DIR = "/Users/chenchunchih/Desktop/數據視覺化/sample_data"
os.makedirs(SAMPLE_DIR, exist_ok=True)

# 樣式定義
header_font = Font(name="Microsoft JhengHei", size=11, bold=True, color="FFFFFF")
header_fill_dark = PatternFill(start_color="1E293B", end_color="1E293B", fill_type="solid")
header_fill_orange = PatternFill(start_color="FF5722", end_color="FF5722", fill_type="solid")
zebra_fill = PatternFill(start_color="F8FAFC", end_color="F8FAFC", fill_type="solid")
border_thin = Border(
    left=Side(style='thin', color='E2E8F0'),
    right=Side(style='thin', color='E2E8F0'),
    top=Side(style='thin', color='E2E8F0'),
    bottom=Side(style='thin', color='E2E8F0')
)

def build_styled_workbook(title, headers, rows):
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = title
    ws.views.sheetView[0].showGridLines = True
    ws.freeze_panes = "A2"
    
    # 寫入表頭
    ws.append(headers)
    for col_idx, cell in enumerate(ws[1], 1):
        cell.font = header_font
        cell.fill = header_fill_orange if col_idx == 1 else header_fill_dark
        cell.alignment = Alignment(horizontal="center", vertical="center")
    
    # 寫入資料
    for r_idx, row in enumerate(rows, 2):
        ws.append(row)
        is_even = (r_idx % 2 == 0)
        for c_idx in range(1, len(headers) + 1):
            cell = ws.cell(row=r_idx, column=c_idx)
            cell.border = border_thin
            if is_even:
                cell.fill = zebra_fill
            if isinstance(cell.value, (int, float)):
                cell.alignment = Alignment(horizontal="right", vertical="center")
            else:
                cell.alignment = Alignment(horizontal="left", vertical="center")
                
    # 自動欄寬
    for col in ws.columns:
        col_letter = get_column_letter(col[0].column)
        max_len = 0
        for cell in col:
            val_str = str(cell.value or '')
            # 中文字符長度加倍計算
            val_len = sum(2 if ord(c) > 127 else 1 for c in val_str)
            if val_len > max_len:
                max_len = val_len
        ws.column_dimensions[col_letter].width = max(max_len + 4, 15)
        
    return wb

# ==========================================
# 1. 測試檔案 1: 產品線營收體量 (適合 01 柱狀體量圖)
# ==========================================
wb1 = build_styled_workbook(
    "產品營收體量",
    ["產品線名稱", "業務類別", "本季營收(萬元)", "目標營收(萬元)", "毛利率(%)", "活躍企業客戶數"],
    [
        ["企業雲端運算平台", "SaaS雲端", 940, 800, 78.5, 342],
        ["智能數據中台", "數據基礎設施", 720, 650, 71.2, 218],
        ["AI視覺辨識模組", "前沿人工智慧", 580, 500, 65.0, 154],
        ["物聯網邊緣節點", "邊緣運算硬體", 430, 450, 48.2, 98],
        ["零信任資安套件", "企業安全", 360, 320, 82.0, 185],
        ["開發者行動端SDK", "開發者工具", 290, 300, 62.4, 420],
        ["私有化部署諮詢", "架構諮詢服務", 210, 250, 52.8, 45],
        ["維運技術支援", "專業服務", 160, 150, 45.0, 32]
    ]
)
wb1.save(os.path.join(SAMPLE_DIR, "01_產品線營收體量_測試.xlsx"))

# ==========================================
# 2. 測試檔案 2: 時序月度趨勢 (適合 02 時序趨勢折線圖)
# ==========================================
wb2 = build_styled_workbook(
    "時序月度趨勢",
    ["月份", "月總營收(萬元)", "付費訂單總數", "新增付費企業", "雲端伺服器成本(萬元)"],
    [
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
)
wb2.save(os.path.join(SAMPLE_DIR, "02_時序月度趨勢_測試.xlsx"))

# ==========================================
# 3. 測試檔案 3: 行銷廣告與獲客相關 (適合 03 相關分佈散點圖)
# ==========================================
wb3 = build_styled_workbook(
    "行銷投入與轉化相關",
    ["廣告投放管道", "廣告預算(千元)", "新增轉化用戶", "獲客成本CPA(元)", "帶動總銷售額(萬元)"],
    [
        ["Google 關鍵字搜尋", 45, 1120, 40.2, 168],
        ["Meta 社交動態廣告", 38, 890, 42.7, 134],
        ["YouTube 影音聯播網", 52, 980, 53.1, 152],
        ["LinkedIn 專業受眾", 28, 420, 66.7, 115],
        ["KOL 評測爆款推薦", 65, 1950, 33.3, 310],  # 明顯強相關亮眼點
        ["線下技術研討會", 30, 380, 78.9, 98],
        ["內容行銷 SEO", 15, 620, 24.2, 92],
        ["電子報 EDM 自動化", 8, 260, 30.8, 38],
        ["聯盟行銷夥伴分潤", 22, 540, 40.7, 85],
        ["傳統戶外看板廣告", 50, 280, 178.6, 42]   # 低效離群點 (Outlier)
    ]
)
wb3.save(os.path.join(SAMPLE_DIR, "03_廣告預算與獲客轉化_測試.xlsx"))

# ==========================================
# 4. 測試檔案 4: 核心業務份額佔比 (適合 04 結構佔比環形圖)
# ==========================================
wb4 = build_styled_workbook(
    "業務結構份額佔比",
    ["業務板塊名稱", "市場規模(億元)", "板塊份額(%)", "年營收增長率(%)", "戰略地位標籤"],
    [
        ["企業核心雲服務", 42.8, 44.5, 38.2, "核心主力金牛"],
        ["智慧製造 AI 方案", 24.5, 25.5, 52.4, "高增長明星業務"],
        ["金融大數據風控", 15.6, 16.2, 28.5, "高利潤防禦業務"],
        ["智慧醫療大數據", 8.9, 9.3, 64.1, "前瞻戰略孵化"],
        ["新零售客流洞察", 4.3, 4.5, 12.0, "探索型邊緣業務"]
    ]
)
wb4.save(os.path.join(SAMPLE_DIR, "04_業務營收結構佔比_測試.xlsx"))

# ==========================================
# 5. 測試檔案 5: 研發團隊多維效能 (適合 05 多維畫像雷達圖)
# ==========================================
wb5 = build_styled_workbook(
    "研發效能多維畫像",
    ["評估維度指標", "實際達成得分", "行業標準基準線", "去年同期表現得分", "目標滿分標準"],
    [
        ["程式碼品質與測試覆蓋", 94, 85, 82, 100],
        ["系統高可用穩定性", 98, 90, 88, 100],
        ["敏捷迭代交付速度", 88, 80, 74, 100],
        ["安全合規與漏洞防護", 96, 85, 90, 100],
        ["微服務架構擴展彈性", 84, 75, 70, 100],
        ["工程團隊人效比", 91, 80, 76, 100]
    ]
)
wb5.save(os.path.join(SAMPLE_DIR, "05_研發效能多維體能_測試.xlsx"))

# ==========================================
# 6. 測試檔案 6: 電商全鏈路漏斗 (適合 06 轉化漏斗圖)
# ==========================================
wb6 = build_styled_workbook(
    "電商全鏈路轉化漏斗",
    ["漏斗轉化階段", "觸達用戶數", "絕對轉化率(%)", "階段流失率(%)", "用戶平均停留(秒)"],
    [
        ["01_首頁品牌登錄", 100000, 100.0, 0.0, 12],
        ["02_瀏覽商品分類列表", 68500, 68.5, 31.5, 45],
        ["03_進入產品詳情頁", 38200, 38.2, 44.2, 92],
        ["04_點擊加入購物車", 19600, 19.6, 48.7, 34],
        ["05_進入結帳收銀台", 14800, 14.8, 24.5, 68],
        ["06_完成最終支付訂單", 10200, 10.2, 31.1, 28]
    ]
)
wb6.save(os.path.join(SAMPLE_DIR, "06_電商全鏈路漏斗_測試.xlsx"))

# ==========================================
# 7. 測試檔案 7: 真實企業複雜數據 (含千分位、百分比符號、日期、字串混合)
# ==========================================
wb7 = build_styled_workbook(
    "企業季度營收明細",
    ["部門代碼", "部門名稱", "負責主管", "季總營收", "目標達成率", "季度預算", "建立日期"],
    [
        ["D-101", "北亞企業軟體處", "林志遠", "1,850,000", "112.5%", "1,640,000", "2024/01/15"],
        ["D-102", "大中華區雲端服務", "張敏華", "2,420,000", "108.0%", "2,240,000", "2024/01/18"],
        ["D-103", "智慧物聯網硬體處", "陳宏銘", "980,000", "85.2%", "1,150,000", "2024/02/01"],
        ["D-104", "人工智慧實驗處", "黃雅婷", "1,450,000", "126.1%", "1,150,000", "2024/02/10"],
        ["D-105", "網路資訊安全小組", "王建平", "820,000", "102.5%", "800,000", "2024/02/20"],
        ["D-106", "海外開發者生態部", "趙立群", "640,000", "91.4%", "700,000", "2024/03/05"],
        ["D-107", "技術顧問交付中心", "劉怡君", "510,000", "85.0%", "600,000", "2024/03/12"]
    ]
)
wb7.save(os.path.join(SAMPLE_DIR, "07_真實企業數據_含格式與千分位_測試.xlsx"))

print("All test Excel files generated successfully in:", SAMPLE_DIR)
