import requests  # 引入函式庫
from bs4 import BeautifulSoup
import re
# print("Bamboo")
url1 = "https://en.wikipedia.org/wiki/List_of_bamboo_species"
resp = requests.get(url1)  
resp.encoding = "utf-8"
soup = BeautifulSoup(resp.text, "lxml")
title = soup.select("tbody tr td i")
for item in title:
    print(item.text)

# print(url1+title)

# resp=requests.get(url1+"/world")
# resp.encoding = "utf-8"
# soup = BeautifulSoup(resp.text, "lxml")
# title = soup.select("a.gs-c-promo-heading")[0]['href']
# print(url1+title)
