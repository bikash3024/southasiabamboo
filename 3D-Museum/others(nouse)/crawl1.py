import requests  # 引入函式庫
from bs4 import BeautifulSoup
import re
url1 = "https://www.ec.ccu.edu.tw/ec/index.php?lang=zh"
resp = requests.get(url1)  
resp.encoding = "utf-8"
soup = BeautifulSoup(resp.text, "lxml")
title = soup.select("section#section-id-1593600835025 h3.sp-simpleportfolio-title a")
for item in title:
    print(item.text)

# print(url1+title)

# resp=requests.get(url1+"/world")
# resp.encoding = "utf-8"
# soup = BeautifulSoup(resp.text, "lxml")
# title = soup.select("a.gs-c-promo-heading")[0]['href']
# print(url1+title)
