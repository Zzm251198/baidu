
// Line Definitions mapped from SVG IDs
export const LINES: Record<string, { name: string, color: string }> = {
  "440300024063": { name: "1号线/罗宝线", color: "#00AB4F" },
  "440300024076": { name: "2号线/8号线", color: "#B35A1F" },
  "440300024060": { name: "3号线/龙岗线", color: "#01A2E2" },
  "440300024074": { name: "4号线/龙华线", color: "#CC0000" },
  "440300024058": { name: "5号线/环中线", color: "#96499A" },
  "440300024046": { name: "6号线/光明线", color: "#00AD8E" },
  "440300024048": { name: "6号线支线", color: "#008187" },
  "440300024050": { name: "7号线/西丽线", color: "#2249A3" },
  "440300024054": { name: "9号线/梅林线", color: "#86656D" },
  "900000055265": { name: "10号线/坂田线", color: "#EA6183" },
  "440300024056": { name: "11号线/机场线", color: "#741D51" },
  "900000094862": { name: "12号线/南宝线", color: "#A49ABD" },
  "900000094840": { name: "13号线/石岩线", color: "#EE782E" },
  "900000095033": { name: "14号线/东部快线", color: "#DAC17D" },
  "900000095071": { name: "16号线/龙坪线", color: "#1C24A4" },
  "900000075925": { name: "20号线/福永线", color: "#019AC3" },
  "900000191216": { name: "云巴1号线", color: "#2249A3" }
};

// Static SVG Content (Lines and Stations)
export const SVG_MAP_CONTENT = `
    <g id="g-lines" stroke-width="4" fill="none">
        <path id="line-440300024063" name="440300024063" stroke="#00AB4F"
            d="M593,950L593 950L593 1157L594 1212L594 1283L596 1286L597 1289L626 1315L626 1368L541 1429L1759 1429L1766 1428L1771 1425L1775 1421L1868 1334L1933 1253L1933 1554"
            stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
        <path id="line-900000191216" name="900000191216" stroke="#2249A3"
            d="M2801,751L2801 751L2801 703L2798 699L2794 695L2785 688L2756 665L2749 655L2746 644L2748 637L2751 633L2756 630L2761 629L2770 629L2993 629L2995 628L2996 627L2998 626L2999 624L3000 607L3005 510L3005 509L3005 509L3003 508L3002 507L2959 508L2877 511L2809 519L2746 527L2657 543"
            stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
        <path id="line-440300024076" name="440300024076" stroke="#B35A1F"
            d="M533,1812L533 1812L564 1843L571 1846L822 1846L844 1840L857 1831L864 1819L866 1802L866 1750L866 1695L869 1602L869 1505L872 1498L877 1493L883 1490L891 1489L908 1489L975 1488L1027 1488L1032 1487L1036 1484L1037 1481L1038 1474L1040 1429L1038 1341L1038 1337L1040 1334L1042 1333L1046 1333L1214 1333L1258 1334L2127 1334L2199 1335L2472 1335L2479 1333L2487 1331L2493 1327L2500 1321L2544 1286L2587 1251L2639 1209L2695 1161L2780 1161L2944 1161L3029 1162"
            stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
        <path id="line-440300024060" name="440300024060" stroke="#01A2E2"
            d="M1433,1743L1433 1743L1432 1649L1433 1532L1433 1427L1434 1334L1433 1293L1434 1287L1437 1283L1475 1253L1933 1253L1933 1203L1933 944L1976 912L2010 885L2045 859L2080 833L2114 808L2148 782L2183 756L2217 729L2253 702L2295 671L2339 638L2381 605L2424 572L2468 539L2500 512L2536 484L2579 452L2619 420L2660 387L2705 353L2751 316"
            stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
        <path id="line-440300024074" name="440300024074" stroke="#CC0000"
            d="M1815,476L1815 476L1725 475L1656 475L1649 476L1643 476L1638 479L1634 481L1628 490L1619 505L1577 573L1548 619L1520 661L1499 694L1479 722L1477 726L1475 730L1475 732L1474 738L1474 754L1475 778L1475 804L1475 878L1474 890L1474 894L1471 898L1467 901L1462 904L1429 923L1425 928L1420 934L1417 942L1420 950L1424 956L1430 963L1470 1009L1474 1015L1475 1019L1475 1429L1476 1532L1477 1628L1477 1629"
            stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
        <path id="line-440300024058" name="440300024058" stroke="#96499A"
            d="M533,1812L533 1812L519 1812L534 1756L535 1698L537 1648L538 1596L538 1561L540 1478L541 1429L542 1385L543 1368L576 1347L626 1315L786 1155L967 972L977 964L986 958L998 951L1012 946L1027 944L1045 942L1417 942L1475 944L1933 944L2038 1054L2045 1062L2051 1071L2058 1080L2061 1088L2062 1095L2062 1144L2062 1334"
            stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
        <path id="line-440300024046" name="440300024046" stroke="#00AD8E"
            d="M658,570L658 570L709 593L714 595L716 596L719 596L770 596L828 597L1101 597L1109 598L1116 601L1122 605L1155 625L1190 647L1228 670L1268 695L1308 718L1348 743L1387 767L1432 794L1491 828L1495 831L1498 834L1499 837L1499 859L1498 863L1496 867L1492 870L1487 873L1475 878L1434 896L1426 899L1419 904L1417 911L1417 942L1416 1044L1415 1051L1415 1057L1417 1060L1422 1062L1571 1062L1593 1063L1649 1063L1731 1064L1743 1064L1752 1066L1756 1072L1757 1080L1757 1097L1756 1191L1755 1253L1754 1316L1752 1429"
            stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
        <path id="line-440300024048" name="440300024048" stroke="#008187"
            d="M1152,767L1152 767L1153 727L1154 678L1155 625L1156 552L1156 545L1159 539L1166 526L1174 517L1203 495L1262 450"
            stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
        <path id="line-440300024050" name="440300024050" stroke="#2249A3"
            d="M1361,889L1361 889L1295 889L1292 890L1290 892L1234 942L1187 986L1182 991L1176 997L1175 999L1174 1002L1172 1054L1173 1112L1173 1181L1173 1333L1220 1390L1222 1391L1223 1392L1262 1392L1263 1393L1264 1393L1264 1394L1265 1394L1299 1429L1323 1454L1323 1518L1324 1521L1325 1523L1327 1527L1328 1528L1330 1530L1332 1531L1334 1531L1336 1532L1479 1532L1539 1563L1548 1567L1550 1568L1638 1568L1643 1567L1646 1567L1649 1566L1651 1564L1654 1563L1657 1560L1659 1556L1659 1334L1657 1253L1657 1234L1658 1228L1660 1223L1663 1218L1668 1210L1672 1204L1704 1164L1707 1159L1703 1163L1746 1103L1751 1099L1754 1098L1757 1097L1762 1096L1964 1096L1966 1097L1968 1097L1970 1099L1973 1101L2062 1213"
            stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
        <path id="line-440300024054" name="440300024054" stroke="#86656D"
            d="M538,1561L538 1561L628 1561L667 1562L712 1562L713 1561L719 1556L728 1550L783 1505L830 1467L840 1457L843 1455L846 1454L851 1453L857 1452L908 1453L930 1453L931 1454L933 1456L941 1473L976 1548L1083 1548L1274 1548L1277 1547L1280 1546L1285 1544L1291 1541L1294 1539L1295 1537L1296 1536L1298 1534L1299 1532L1299 1377L1300 1334L1300 1145L1303 1140L1306 1136L1310 1133L1314 1132L1320 1131L1578 1131L1579 1130L1580 1130L1649 1063L1695 1011L1702 1005L1714 1001L1719 1000L1824 1000L1827 1001L1830 1002L1833 1004L1835 1005L1837 1007L1840 1010L1841 1013L1841 1173L1840 1253L1840 1492L1841 1494L1842 1496L1844 1498L1845 1500L1847 1502L1851 1503L1856 1504L2017 1504L2019 1503L2021 1502L2023 1500L2025 1499L2026 1497L2028 1494L2028 1490L2028 1376"
            stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
        <path id="line-900000055265" name="900000055265" stroke="#EA6183"
            d="M1836,566L1836 566L1836 607L1837 648L1837 748L1836 753L1836 755L1834 756L1830 758L1827 759L1824 759L1817 760L1806 760L1754 759L1646 759L1603 758L1597 758L1592 759L1586 760L1582 762L1580 764L1578 768L1577 775L1577 805L1575 856L1574 900L1573 943L1572 972L1571 998L1570 1031L1569 1131L1568 1195L1567 1253L1566 1334L1566 1455L1565 1456L1565 1457L1564 1457L1563 1458L1500 1512L1496 1515L1493 1519L1492 1520L1492 1521L1492 1521L1491 1522L1491 1532L1494 1628"
            stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
        <path id="line-440300024056" name="440300024056" stroke="#741D51"
            d="M658,540L658 540L658 724L659 770L659 804L658 811L654 817L649 823L611 854L575 885L537 918L494 954L492 957L489 959L488 962L488 966L489 1000L490 1121L492 1243L493 1347L541 1429L705 1504L801 1596L807 1600L813 1601L869 1602L921 1602L925 1601L928 1599L976 1548L1006 1518L1244 1518L1252 1517L1258 1517L1264 1514L1270 1510L1274 1504L1275 1500L1276 1496L1299 1429L1323 1405L1326 1401L1329 1400L1331 1400L1332 1399L1367 1399L1369 1398L1372 1397L1373 1397L1434 1334L1463 1305L1463 1304L1464 1303L1466 1302L1467 1301L1469 1300L1527 1300L1531 1302L1533 1303L1535 1305L1566 1334L1596 1361L1598 1363L1600 1364L1601 1366L1602 1367L1603 1369L1603 1371L1604 1375L1605 1463L1607 1467L1609 1469L1611 1471L1614 1472L1618 1474L1621 1474L1624 1475L1659 1475"
            stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
        <path id="line-900000094862" name="900000094862" stroke="#A49ABD"
            d="M658,570L658 570L594 570L585 571L576 573L534 582L479 594L444 602L440 602L436 604L433 606L431 609L428 616L427 640L428 666L428 700L428 758L429 765L432 775L438 782L472 808L526 848L575 885L594 900L604 908L605 909L605 974L606 975L608 977L611 978L645 986L693 996L722 1002L724 1003L727 1006L727 1008L727 1138L729 1142L732 1145L737 1148L742 1149L786 1155L799 1174L802 1184L803 1199L802 1253L802 1366L801 1429L705 1504L705 1524L707 1562L706 1657L707 1759L705 1785L692 1813L666 1846L605 1923L558 1983"
            stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
        <path id="line-900000094840" name="900000094840" stroke="#EE782E"
            d="M1019,1734L1019 1734L943 1697L933 1691L927 1686L920 1681L916 1676L873 1615L870 1609L870 1607L869 1602L869 1599L870 1597L871 1594L908 1489L908 1453L908 1385"
            stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
        <path id="line-900000095033" name="900000095033" stroke="#DAC17D"
            d="M1566,1334L1566 1334L1576 1297L1584 1282L1596 1263L1608 1245L1682 1151L1685 1147L1684 1147L1731 1090L1737 1084L1744 1081L1751 1080L1782 1079L1790 1079L1794 1077L1822 1044L1933 944L1956 909L1960 902L1960 866L1967 857L1977 849L2033 806L2089 763L2145 721L2164 707L2178 703L2253 702L2344 703L2521 703L2609 704L2620 704L2637 701L2653 692L2675 676L2809 574L2940 472L2999 424"
            stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
        <path id="line-900000095071" name="900000095071" stroke="#1C24A4"
            d="M2346,1143L2346 1143L2346 1056L2347 1000L2347 898L2346 847L2346 788L2345 787L2345 786L2253 702L2201 664L2152 627L2145 622L2141 618L2138 613L2136 608L2134 602L2135 573L2136 537L2139 531L2145 525L2155 520L2165 519L2204 518L2274 518L2342 517L2421 517L2431 518L2439 521L2468 539L2493 556L2498 558L2505 559L2529 559L2576 560L2602 560L2625 560L2638 564L2647 569L2652 577L2654 585L2654 606L2654 656L2656 659L2675 676L2705 702L2707 703L2710 703L2774 703L2829 704L3055 704"
            stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
        <path id="line-900000075925" name="900000075925" stroke="#019AC3"
            d="M537,918L537 918L414 886L409 883L405 880L404 874L405 843L404 758L404 696L405 638" stroke-width="4"
            stroke-linecap="round" stroke-linejoin="round"/>
    </g>
    <g id="g-stations">
        <circle cx="1933" cy="1554" r="8" fill="#ffffff" stroke="none" data-station-id="440300024063031"/>
        <circle cx="1933" cy="1429" r="8" fill="#ffffff" stroke="none" data-station-id="440300024063030"/>
        <circle cx="1933" cy="1253" r="8" fill="#ffffff" stroke="none" data-station-id="440300024060022"/>
        <circle cx="1868" cy="1334" r="8" fill="#ffffff" stroke="none" data-station-id="440300024063028"/>
        <circle cx="1752" cy="1429" r="8" fill="#ffffff" stroke="none" data-station-id="440300024046036"/>
        <circle cx="1700" cy="1429" r="8" fill="#ffffff" stroke="none" data-station-id="440300024063026"/>
        <circle cx="1566" cy="1429" r="8" fill="#ffffff" stroke="none" data-station-id="440300024063025"/>
        <circle cx="1475" cy="1429" r="8" fill="#ffffff" stroke="none" data-station-id="440300024063024"/>
        <circle cx="1433" cy="1429" r="8" fill="#ffffff" stroke="none" data-station-id="440300024060029"/>
        <circle cx="1353" cy="1429" r="8" fill="#ffffff" stroke="none" data-station-id="440300024063022"/>
        <circle cx="1299" cy="1429" r="8" fill="#ffffff" stroke="none" data-station-id="440300024050011"/>
        <circle cx="1243" cy="1429" r="8" fill="#ffffff" stroke="none" data-station-id="440300024063020"/>
        <circle cx="1186" cy="1429" r="8" fill="#ffffff" stroke="none" data-station-id="440300024063019"/>
        <circle cx="1123" cy="1429" r="8" fill="#ffffff" stroke="none" data-station-id="440300024063018"/>
        <circle cx="1040" cy="1429" r="8" fill="#ffffff" stroke="none" data-station-id="440300024063017"/>
        <circle cx="1002" cy="1429" r="8" fill="#ffffff" stroke="none" data-station-id="440300024063016"/>
        <circle cx="952" cy="1429" r="8" fill="#ffffff" stroke="none" data-station-id="440300024063015"/>
        <circle cx="908" cy="1429" r="8" fill="#ffffff" stroke="none" data-station-id="440300024063014"/>
        <circle cx="801" cy="1429" r="8" fill="#ffffff" stroke="none" data-station-id="440300024063013"/>
        <circle cx="743" cy="1429" r="8" fill="#ffffff" stroke="none" data-station-id="440300024063012"/>
        <circle cx="684" cy="1429" r="8" fill="#ffffff" stroke="none" data-station-id="440300024063011"/>
        <circle cx="541" cy="1429" r="8" fill="#ffffff" stroke="none" data-station-id="440300024056006"/>
        <circle cx="626" cy="1368" r="8" fill="#ffffff" stroke="none" data-station-id="440300024063009"/>
        <circle cx="626" cy="1315" r="8" fill="#ffffff" stroke="none" data-station-id="440300024058025"/>
        <circle cx="594" cy="1265" r="8" fill="#ffffff" stroke="none" data-station-id="440300024063007"/>
        <circle cx="594" cy="1212" r="8" fill="#ffffff" stroke="none" data-station-id="440300024063006"/>
        <circle cx="593" cy="1157" r="8" fill="#ffffff" stroke="none" data-station-id="440300024063005"/>
        <circle cx="593" cy="1101" r="8" fill="#ffffff" stroke="none" data-station-id="440300024063004"/>
        <circle cx="593" cy="1046" r="8" fill="#ffffff" stroke="none" data-station-id="440300024063003"/>
        <circle cx="599" cy="950" r="8" fill="#ffffff" stroke="none" data-station-id="440300024063002"/>
        <circle cx="519" cy="1812" r="8" fill="#ffffff" stroke="none" data-station-id="440300024058035"/>
        <circle cx="579" cy="1846" r="8" fill="#ffffff" stroke="none" data-station-id="440300024076003"/>
        <circle cx="666" cy="1846" r="8" fill="#ffffff" stroke="none" data-station-id="440300024076004"/>
        <circle cx="745" cy="1846" r="8" fill="#ffffff" stroke="none" data-station-id="440300024076005"/>
        <circle cx="822" cy="1846" r="8" fill="#ffffff" stroke="none" data-station-id="440300024076006"/>
        <circle cx="866" cy="1802" r="8" fill="#ffffff" stroke="none" data-station-id="440300024076007"/>
        <circle cx="866" cy="1750" r="8" fill="#ffffff" stroke="none" data-station-id="440300024076008"/>
        <circle cx="866" cy="1695" r="8" fill="#ffffff" stroke="none" data-station-id="440300024076009"/>
        <circle cx="869" cy="1602" r="8" fill="#ffffff" stroke="none" data-station-id="440300024056016"/>
        <circle cx="908" cy="1489" r="8" fill="#ffffff" stroke="none" data-station-id="440300024076011"/>
        <circle cx="975" cy="1488" r="8" fill="#ffffff" stroke="none" data-station-id="440300024076012"/>
        <circle cx="1046" cy="1333" r="8" fill="#ffffff" stroke="none" data-station-id="440300024076014"/>
        <circle cx="1088" cy="1333" r="8" fill="#ffffff" stroke="none" data-station-id="440300024076015"/>
        <circle cx="1173" cy="1333" r="8" fill="#ffffff" stroke="none" data-station-id="440300024050009"/>
        <circle cx="1194" cy="1333" r="8" fill="#ffffff" stroke="none" data-station-id="440300024076017"/>
        <circle cx="1214" cy="1333" r="8" fill="#ffffff" stroke="none" data-station-id="440300024076018"/>
        <circle cx="1258" cy="1334" r="8" fill="#ffffff" stroke="none" data-station-id="440300024076019"/>
        <circle cx="1300" cy="1334" r="8" fill="#ffffff" stroke="none" data-station-id="440300024054015"/>
        <circle cx="1365" cy="1334" r="8" fill="#ffffff" stroke="none" data-station-id="440300024076021"/>
        <circle cx="1434" cy="1334" r="8" fill="#ffffff" stroke="none" data-station-id="440300024056002"/>
        <circle cx="1475" cy="1334" r="8" fill="#ffffff" stroke="none" data-station-id="440300024074013"/>
        <circle cx="1566" cy="1334" r="8" fill="#ffffff" stroke="none" data-station-id="440300024056027"/>
        <circle cx="1659" cy="1334" r="8" fill="#ffffff" stroke="none" data-station-id="440300024050028"/>
        <circle cx="1749" cy="1334" r="8" fill="#ffffff" stroke="none" data-station-id="440300024076026"/>
        <circle cx="1986" cy="1334" r="8" fill="#ffffff" stroke="none" data-station-id="440300024076028"/>
        <circle cx="2062" cy="1334" r="8" fill="#ffffff" stroke="none" data-station-id="440300024058002"/>
        <circle cx="2127" cy="1334" r="8" fill="#ffffff" stroke="none" data-station-id="440300024076030"/>
        <circle cx="2199" cy="1335" r="8" fill="#ffffff" stroke="none" data-station-id="440300024076031"/>
        <circle cx="2278" cy="1335" r="8" fill="#ffffff" stroke="none" data-station-id="440300024076032"/>
        <circle cx="2348" cy="1335" r="8" fill="#ffffff" stroke="none" data-station-id="440300024076033"/>
        <circle cx="2427" cy="1335" r="8" fill="#ffffff" stroke="none" data-station-id="440300024076034"/>
        <circle cx="2500" cy="1321" r="8" fill="#ffffff" stroke="none" data-station-id="440300024076035"/>
        <circle cx="2544" cy="1286" r="8" fill="#ffffff" stroke="none" data-station-id="440300024076036"/>
        <circle cx="2587" cy="1251" r="8" fill="#ffffff" stroke="none" data-station-id="440300024076037"/>
        <circle cx="2639" cy="1209" r="8" fill="#ffffff" stroke="none" data-station-id="440300024076038"/>
        <circle cx="2695" cy="1161" r="8" fill="#ffffff" stroke="none" data-station-id="440300024076039"/>
        <circle cx="2780" cy="1161" r="8" fill="#ffffff" stroke="none" data-station-id="440300024076040"/>
        <circle cx="2866" cy="1161" r="8" fill="#ffffff" stroke="none" data-station-id="440300024076041"/>
        <circle cx="2944" cy="1161" r="8" fill="#ffffff" stroke="none" data-station-id="440300024076042"/>
        <circle cx="3029" cy="1162" r="8" fill="#ffffff" stroke="none" data-station-id="440300024076043"/>
        <circle cx="1433" cy="1743" r="8" fill="#ffffff" stroke="none" data-station-id="440300024060032"/>
        <circle cx="1432" cy="1649" r="8" fill="#ffffff" stroke="none" data-station-id="440300024060031"/>
        <circle cx="1433" cy="1532" r="8" fill="#ffffff" stroke="none" data-station-id="440300024050014"/>
        <circle cx="1475" cy="1253" r="8" fill="#ffffff" stroke="none" data-station-id="440300024060027"/>
        <circle cx="1567" cy="1253" r="8" fill="#ffffff" stroke="none" data-station-id="440300024060026"/>
        <circle cx="1657" cy="1253" r="8" fill="#ffffff" stroke="none" data-station-id="440300024050019"/>
        <circle cx="1755" cy="1253" r="8" fill="#ffffff" stroke="none" data-station-id="440300024046037"/>
        <circle cx="1840" cy="1253" r="8" fill="#ffffff" stroke="none" data-station-id="440300024054005"/>
        <circle cx="1933" cy="1203" r="8" fill="#ffffff" stroke="none" data-station-id="440300024060021"/>
        <circle cx="1933" cy="1151" r="8" fill="#ffffff" stroke="none" data-station-id="440300024060020"/>
        <circle cx="1933" cy="1096" r="8" fill="#ffffff" stroke="none" data-station-id="440300024050023"/>
        <circle cx="1933" cy="1048" r="8" fill="#ffffff" stroke="none" data-station-id="440300024060018"/>
        <circle cx="1933" cy="998" r="8" fill="#ffffff" stroke="none" data-station-id="440300024060017"/>
        <circle cx="1933" cy="944" r="8" fill="#ffffff" stroke="none" data-station-id="440300024058007"/>
        <circle cx="1976" cy="912" r="8" fill="#ffffff" stroke="none" data-station-id="440300024060015"/>
        <circle cx="2010" cy="885" r="8" fill="#ffffff" stroke="none" data-station-id="440300024060014"/>
        <circle cx="2045" cy="859" r="8" fill="#ffffff" stroke="none" data-station-id="440300024060013"/>
        <circle cx="2080" cy="833" r="8" fill="#ffffff" stroke="none" data-station-id="440300024060012"/>
        <circle cx="2114" cy="808" r="8" fill="#ffffff" stroke="none" data-station-id="440300024060011"/>
        <circle cx="2148" cy="782" r="8" fill="#ffffff" stroke="none" data-station-id="440300024060010"/>
        <circle cx="2183" cy="756" r="8" fill="#ffffff" stroke="none" data-station-id="440300024060009"/>
        <circle cx="2217" cy="729" r="8" fill="#ffffff" stroke="none" data-station-id="440300024060008"/>
        <circle cx="2253" cy="702" r="8" fill="#ffffff" stroke="none" data-station-id="440300024060007"/>
        <circle cx="2295" cy="671" r="8" fill="#ffffff" stroke="none" data-station-id="440300024060006"/>
        <circle cx="2339" cy="638" r="8" fill="#ffffff" stroke="none" data-station-id="440300024060005"/>
        <circle cx="2381" cy="605" r="8" fill="#ffffff" stroke="none" data-station-id="440300024060004"/>
        <circle cx="2424" cy="572" r="8" fill="#ffffff" stroke="none" data-station-id="440300024060003"/>
        <circle cx="2468" cy="539" r="8" fill="#ffffff" stroke="none" data-station-id="440300024060002"/>
        <circle cx="2500" cy="512" r="8" fill="#ffffff" stroke="none" data-station-id="440300024060039"/>
        <circle cx="2536" cy="484" r="8" fill="#ffffff" stroke="none" data-station-id="440300024060038"/>
        <circle cx="2579" cy="452" r="8" fill="#ffffff" stroke="none" data-station-id="440300024060037"/>
        <circle cx="2619" cy="420" r="8" fill="#ffffff" stroke="none" data-station-id="440300024060036"/>
        <circle cx="2660" cy="387" r="8" fill="#ffffff" stroke="none" data-station-id="440300024060035"/>
        <circle cx="2705" cy="353" r="8" fill="#ffffff" stroke="none" data-station-id="440300024060034"/>
        <circle cx="2751" cy="316" r="8" fill="#ffffff" stroke="none" data-station-id="440300024060033"/>
        <circle cx="1479" cy="1629" r="8" fill="#ffffff" stroke="none" data-station-id="440300024074016"/>
        <circle cx="1479" cy="1532" r="8" fill="#ffffff" stroke="none" data-station-id="440300024050015"/>
        <circle cx="1475" cy="1191" r="8" fill="#ffffff" stroke="none" data-station-id="440300024074011"/>
        <circle cx="1475" cy="1131" r="8" fill="#ffffff" stroke="none" data-station-id="440300024054011"/>
        <circle cx="1475" cy="1074" r="8" fill="#ffffff" stroke="none" data-station-id="440300024074009"/>
        <circle cx="1470" cy="1009" r="8" fill="#ffffff" stroke="none" data-station-id="440300024074008"/>
        <circle cx="1417" cy="942" r="8" fill="#ffffff" stroke="none" data-station-id="440300024046002"/>
        <circle cx="1475" cy="878" r="8" fill="#ffffff" stroke="none" data-station-id="440300024046003"/>
        <circle cx="1475" cy="804" r="8" fill="#ffffff" stroke="none" data-station-id="440300024074005"/>
        <circle cx="1475" cy="778" r="8" fill="#ffffff" stroke="none" data-station-id="440300024074004"/>
        <circle cx="1474" cy="754" r="8" fill="#ffffff" stroke="none" data-station-id="440300024074003"/>
        <circle cx="1499" cy="694" r="8" fill="#ffffff" stroke="none" data-station-id="440300024074002"/>
        <circle cx="1520" cy="661" r="8" fill="#ffffff" stroke="none" data-station-id="440300024074024"/>
        <circle cx="1548" cy="619" r="8" fill="#ffffff" stroke="none" data-station-id="440300024074023"/>
        <circle cx="1577" cy="573" r="8" fill="#ffffff" stroke="none" data-station-id="440300024074022"/>
        <circle cx="1598" cy="539" r="8" fill="#ffffff" stroke="none" data-station-id="440300024074021"/>
        <circle cx="1628" cy="490" r="8" fill="#ffffff" stroke="none" data-station-id="440300024074020"/>
        <circle cx="1656" cy="475" r="8" fill="#ffffff" stroke="none" data-station-id="440300024074019"/>
        <circle cx="1725" cy="475" r="8" fill="#ffffff" stroke="none" data-station-id="440300024074018"/>
        <circle cx="1815" cy="476" r="8" fill="#ffffff" stroke="none" data-station-id="440300024074017"/>
        <circle cx="534" cy="1756" r="8" fill="#ffffff" stroke="none" data-station-id="440300024058034"/>
        <circle cx="535" cy="1698" r="8" fill="#ffffff" stroke="none" data-station-id="440300024058033"/>
        <circle cx="537" cy="1648" r="8" fill="#ffffff" stroke="none" data-station-id="440300024058032"/>
        <circle cx="538" cy="1596" r="8" fill="#ffffff" stroke="none" data-station-id="440300024058031"/>
        <circle cx="538" cy="1561" r="8" fill="#ffffff" stroke="none" data-station-id="440300024054041"/>
        <circle cx="540" cy="1478" r="8" fill="#ffffff" stroke="none" data-station-id="440300024058029"/>
        <circle cx="542" cy="1385" r="8" fill="#ffffff" stroke="none" data-station-id="440300024058027"/>
        <circle cx="576" cy="1347" r="8" fill="#ffffff" stroke="none" data-station-id="440300024058026"/>
        <circle cx="683" cy="1258" r="8" fill="#ffffff" stroke="none" data-station-id="440300024058024"/>
        <circle cx="786" cy="1155" r="8" fill="#ffffff" stroke="none" data-station-id="440300024058023"/>
        <circle cx="967" cy="972" r="8" fill="#ffffff" stroke="none" data-station-id="440300024058022"/>
        <circle cx="1045" cy="942" r="8" fill="#ffffff" stroke="none" data-station-id="440300024058021"/>
        <circle cx="1174" cy="942" r="8" fill="#ffffff" stroke="none" data-station-id="440300024058020"/>
        <circle cx="1234" cy="942" r="8" fill="#ffffff" stroke="none" data-station-id="440300024050004"/>
        <circle cx="1267" cy="942" r="8" fill="#ffffff" stroke="none" data-station-id="440300024058018"/>
        <circle cx="1307" cy="942" r="8" fill="#ffffff" stroke="none" data-station-id="440300024058017"/>
        <circle cx="1362" cy="942" r="8" fill="#ffffff" stroke="none" data-station-id="440300024058016"/>
        <circle cx="1536" cy="944" r="8" fill="#ffffff" stroke="none" data-station-id="440300024058014"/>
        <circle cx="1573" cy="943" r="8" fill="#ffffff" stroke="none" data-station-id="440300024058013"/>
        <circle cx="1648" cy="944" r="8" fill="#ffffff" stroke="none" data-station-id="440300024058012"/>
        <circle cx="1704" cy="944" r="8" fill="#ffffff" stroke="none" data-station-id="440300024058011"/>
        <circle cx="1766" cy="944" r="8" fill="#ffffff" stroke="none" data-station-id="440300024058010"/>
        <circle cx="1821" cy="944" r="8" fill="#ffffff" stroke="none" data-station-id="440300024058009"/>
        <circle cx="1877" cy="944" r="8" fill="#ffffff" stroke="none" data-station-id="440300024058008"/>
        <circle cx="2038" cy="1054" r="8" fill="#ffffff" stroke="none" data-station-id="440300024058006"/>
        <circle cx="2062" cy="1144" r="8" fill="#ffffff" stroke="none" data-station-id="440300024058005"/>
        <circle cx="2062" cy="1213" r="8" fill="#ffffff" stroke="none" data-station-id="440300024050024"/>
        <circle cx="2062" cy="1280" r="8" fill="#ffffff" stroke="none" data-station-id="440300024058003"/>
        <circle cx="658" cy="570" r="8" fill="#ffffff" stroke="none" data-station-id="440300024046020"/>
        <circle cx="716" cy="596" r="8" fill="#ffffff" stroke="none" data-station-id="440300024046035"/>
        <circle cx="770" cy="596" r="8" fill="#ffffff" stroke="none" data-station-id="440300024046018"/>
        <circle cx="828" cy="597" r="8" fill="#ffffff" stroke="none" data-station-id="440300024046034"/>
        <circle cx="884" cy="597" r="8" fill="#ffffff" stroke="none" data-station-id="440300024046033"/>
        <circle cx="938" cy="597" r="8" fill="#ffffff" stroke="none" data-station-id="440300024046015"/>
        <circle cx="991" cy="597" r="8" fill="#ffffff" stroke="none" data-station-id="440300024046032"/>
        <circle cx="1049" cy="597" r="8" fill="#ffffff" stroke="none" data-station-id="440300024046031"/>
        <circle cx="1090" cy="597" r="8" fill="#ffffff" stroke="none" data-station-id="440300024046030"/>
        <circle cx="1155" cy="625" r="8" fill="#ffffff" stroke="none" data-station-id="440300024046029"/>
        <circle cx="1190" cy="647" r="8" fill="#ffffff" stroke="none" data-station-id="440300024046028"/>
        <circle cx="1228" cy="670" r="8" fill="#ffffff" stroke="none" data-station-id="440300024046027"/>
        <circle cx="1268" cy="695" r="8" fill="#ffffff" stroke="none" data-station-id="440300024046026"/>
        <circle cx="1308" cy="718" r="8" fill="#ffffff" stroke="none" data-station-id="440300024046025"/>
        <circle cx="1348" cy="743" r="8" fill="#ffffff" stroke="none" data-station-id="440300024046024"/>
        <circle cx="1387" cy="767" r="8" fill="#ffffff" stroke="none" data-station-id="440300024046023"/>
        <circle cx="1432" cy="794" r="8" fill="#ffffff" stroke="none" data-station-id="440300024046022"/>
        <circle cx="1499" cy="849" r="8" fill="#ffffff" stroke="none" data-station-id="440300024046021"/>
        <circle cx="1416" cy="1044" r="8" fill="#ffffff" stroke="none" data-station-id="440300024046041"/>
        <circle cx="1601" cy="1063" r="8" fill="#ffffff" stroke="none" data-station-id="440300024046040"/>
        <circle cx="1649" cy="1063" r="8" fill="#ffffff" stroke="none" data-station-id="440300024046039"/>
        <circle cx="1757" cy="1097" r="8" fill="#ffffff" stroke="none" data-station-id="440300024046038"/>
        <circle cx="1756" cy="1191" r="8" fill="#ffffff" stroke="none" data-station-id="440300024046042"/>
        <circle cx="1152" cy="767" r="8" fill="#ffffff" stroke="none" data-station-id="440300024048007"/>
        <circle cx="1153" cy="727" r="8" fill="#ffffff" stroke="none" data-station-id="440300024048008"/>
        <circle cx="1154" cy="678" r="8" fill="#ffffff" stroke="none" data-station-id="440300024048009"/>
        <circle cx="1156" cy="552" r="8" fill="#ffffff" stroke="none" data-station-id="440300024048003"/>
        <circle cx="1203" cy="495" r="8" fill="#ffffff" stroke="none" data-station-id="440300024048005"/>
        <circle cx="1262" cy="450" r="8" fill="#ffffff" stroke="none" data-station-id="440300024048006"/>
        <circle cx="1326" cy="889" r="8" fill="#ffffff" stroke="none" data-station-id="440300024050032"/>
        <circle cx="1295" cy="889" r="8" fill="#ffffff" stroke="none" data-station-id="440300024050003"/>
        <circle cx="1187" cy="986" r="8" fill="#ffffff" stroke="none" data-station-id="440300024050025"/>
        <circle cx="1172" cy="1054" r="8" fill="#ffffff" stroke="none" data-station-id="440300024050005"/>
        <circle cx="1173" cy="1112" r="8" fill="#ffffff" stroke="none" data-station-id="440300024050006"/>
        <circle cx="1173" cy="1181" r="8" fill="#ffffff" stroke="none" data-station-id="440300024050007"/>
        <circle cx="1173" cy="1252" r="8" fill="#ffffff" stroke="none" data-station-id="440300024050008"/>
        <circle cx="1243" cy="1392" r="8" fill="#ffffff" stroke="none" data-station-id="440300024050010"/>
        <circle cx="1346" cy="1532" r="8" fill="#ffffff" stroke="none" data-station-id="440300024050012"/>
        <circle cx="1391" cy="1532" r="8" fill="#ffffff" stroke="none" data-station-id="440300024050013"/>
        <circle cx="1454" cy="1532" r="8" fill="#ffffff" stroke="none" data-station-id="440300024050026"/>
        <circle cx="1567" cy="1568" r="8" fill="#ffffff" stroke="none" data-station-id="440300024050016"/>
        <circle cx="1659" cy="1513" r="8" fill="#ffffff" stroke="none" data-station-id="440300024050017"/>
        <circle cx="1659" cy="1475" r="8" fill="#ffffff" stroke="none" data-station-id="440300024050018"/>
        <circle cx="1694" cy="1154" r="8" fill="#ffffff" stroke="none" data-station-id="440300024050020"/>
        <circle cx="1841" cy="1096" r="8" fill="#ffffff" stroke="none" data-station-id="440300024050022"/>
        <circle cx="1866" cy="1096" r="8" fill="#ffffff" stroke="none" data-station-id="440300024050029"/>
        <circle cx="1901" cy="1096" r="8" fill="#ffffff" stroke="none" data-station-id="440300024050030"/>
        <circle cx="1361" cy="889" r="8" fill="#ffffff" stroke="none" data-station-id="440300024050031"/>
        <circle cx="565" cy="1561" r="8" fill="#ffffff" stroke="none" data-station-id="440300024054040"/>
        <circle cx="599" cy="1561" r="8" fill="#ffffff" stroke="none" data-station-id="440300024054039"/>
        <circle cx="628" cy="1561" r="8" fill="#ffffff" stroke="none" data-station-id="440300024054038"/>
        <circle cx="667" cy="1562" r="8" fill="#ffffff" stroke="none" data-station-id="440300024054037"/>
        <circle cx="707" cy="1562" r="8" fill="#ffffff" stroke="none" data-station-id="440300024054036"/>
        <circle cx="719" cy="1556" r="8" fill="#ffffff" stroke="none" data-station-id="440300024054035"/>
        <circle cx="783" cy="1505" r="8" fill="#ffffff" stroke="none" data-station-id="440300024054034"/>
        <circle cx="908" cy="1453" r="8" fill="#ffffff" stroke="none" data-station-id="440300024054033"/>
        <circle cx="941" cy="1473" r="8" fill="#ffffff" stroke="none" data-station-id="440300024054032"/>
        <circle cx="976" cy="1548" r="8" fill="#ffffff" stroke="none" data-station-id="440300024054031"/>
        <circle cx="1083" cy="1548" r="8" fill="#ffffff" stroke="none" data-station-id="440300024054030"/>
        <circle cx="1145" cy="1548" r="8" fill="#ffffff" stroke="none" data-station-id="440300024054029"/>
        <circle cx="1214" cy="1548" r="8" fill="#ffffff" stroke="none" data-station-id="440300024054028"/>
        <circle cx="1299" cy="1377" r="8" fill="#ffffff" stroke="none" data-station-id="440300024054016"/>
        <circle cx="1300" cy="1207" r="8" fill="#ffffff" stroke="none" data-station-id="440300024054027"/>
        <circle cx="1354" cy="1131" r="8" fill="#ffffff" stroke="none" data-station-id="440300024054026"/>
        <circle cx="1412" cy="1131" r="8" fill="#ffffff" stroke="none" data-station-id="440300024054025"/>
        <circle cx="1569" cy="1131" r="8" fill="#ffffff" stroke="none" data-station-id="440300024054024"/>
        <circle cx="1816" cy="1000" r="8" fill="#ffffff" stroke="none" data-station-id="440300024054023"/>
        <circle cx="1841" cy="1173" r="8" fill="#ffffff" stroke="none" data-station-id="440300024054006"/>
        <circle cx="1840" cy="1431" r="8" fill="#ffffff" stroke="none" data-station-id="440300024054004"/>
        <circle cx="1876" cy="1504" r="8" fill="#ffffff" stroke="none" data-station-id="440300024054003"/>
        <circle cx="1908" cy="1504" r="8" fill="#ffffff" stroke="none" data-station-id="440300024054021"/>
        <circle cx="2028" cy="1448" r="8" fill="#ffffff" stroke="none" data-station-id="440300024054020"/>
        <circle cx="2028" cy="1376" r="8" fill="#ffffff" stroke="none" data-station-id="440300024054019"/>
        <circle cx="1836" cy="566" r="8" fill="#ffffff" stroke="none" data-station-id="900000055265023"/>
        <circle cx="1836" cy="607" r="8" fill="#ffffff" stroke="none" data-station-id="900000055265022"/>
        <circle cx="1837" cy="648" r="8" fill="#ffffff" stroke="none" data-station-id="900000055265021"/>
        <circle cx="1837" cy="688" r="8" fill="#ffffff" stroke="none" data-station-id="900000055265020"/>
        <circle cx="1837" cy="723" r="8" fill="#ffffff" stroke="none" data-station-id="900000055265019"/>
        <circle cx="1837" cy="748" r="8" fill="#ffffff" stroke="none" data-station-id="900000055265018"/>
        <circle cx="1806" cy="760" r="8" fill="#ffffff" stroke="none" data-station-id="900000055265017"/>
        <circle cx="1754" cy="759" r="8" fill="#ffffff" stroke="none" data-station-id="900000055265016"/>
        <circle cx="1698" cy="759" r="8" fill="#ffffff" stroke="none" data-station-id="900000055265015"/>
        <circle cx="1646" cy="759" r="8" fill="#ffffff" stroke="none" data-station-id="900000055265014"/>
        <circle cx="1577" cy="805" r="8" fill="#ffffff" stroke="none" data-station-id="900000055265013"/>
        <circle cx="1575" cy="856" r="8" fill="#ffffff" stroke="none" data-station-id="900000055265012"/>
        <circle cx="1574" cy="900" r="8" fill="#ffffff" stroke="none" data-station-id="900000055265011"/>
        <circle cx="1572" cy="972" r="8" fill="#ffffff" stroke="none" data-station-id="900000055265009"/>
        <circle cx="1571" cy="998" r="8" fill="#ffffff" stroke="none" data-station-id="900000055265024"/>
        <circle cx="1570" cy="1031" r="8" fill="#ffffff" stroke="none" data-station-id="900000055265008"/>
        <circle cx="1568" cy="1195" r="8" fill="#ffffff" stroke="none" data-station-id="900000055265006"/>
        <circle cx="658" cy="540" r="8" fill="#ffffff" stroke="none" data-station-id="440300024056025"/>
        <circle cx="658" cy="635" r="8" fill="#ffffff" stroke="none" data-station-id="440300024056024"/>
        <circle cx="658" cy="678" r="8" fill="#ffffff" stroke="none" data-station-id="440300024056023"/>
        <circle cx="658" cy="724" r="8" fill="#ffffff" stroke="none" data-station-id="440300024056022"/>
        <circle cx="659" cy="770" r="8" fill="#ffffff" stroke="none" data-station-id="440300024056021"/>
        <circle cx="611" cy="854" r="8" fill="#ffffff" stroke="none" data-station-id="440300024056020"/>
        <circle cx="575" cy="885" r="8" fill="#ffffff" stroke="none" data-station-id="440300024056009"/>
        <circle cx="537" cy="918" r="8" fill="#ffffff" stroke="none" data-station-id="440300024056026"/>
        <circle cx="489" cy="1000" r="8" fill="#ffffff" stroke="none" data-station-id="440300024056019"/>
        <circle cx="490" cy="1121" r="8" fill="#ffffff" stroke="none" data-station-id="440300024056018"/>
        <circle cx="492" cy="1243" r="8" fill="#ffffff" stroke="none" data-station-id="440300024056017"/>
        <circle cx="705" cy="1504" r="8" fill="#ffffff" stroke="none" data-station-id="440300024056005"/>
        <circle cx="1602" cy="1367" r="8" fill="#ffffff" stroke="none" data-station-id="440300024056029"/>
        <circle cx="594" cy="570" r="8" fill="#ffffff" stroke="none" data-station-id="900000094862035"/>
        <circle cx="534" cy="582" r="8" fill="#ffffff" stroke="none" data-station-id="900000094862036"/>
        <circle cx="479" cy="594" r="8" fill="#ffffff" stroke="none" data-station-id="900000094862037"/>
        <circle cx="444" cy="602" r="8" fill="#ffffff" stroke="none" data-station-id="900000094862038"/>
        <circle cx="428" cy="616" r="8" fill="#ffffff" stroke="none" data-station-id="900000094862039"/>
        <circle cx="427" cy="640" r="8" fill="#ffffff" stroke="none" data-station-id="900000094862001"/>
        <circle cx="428" cy="666" r="8" fill="#ffffff" stroke="none" data-station-id="900000094862002"/>
        <circle cx="415" cy="696" r="8" fill="#ffffff" stroke="none" data-station-id="900000075925005"/>
        <circle cx="416" cy="758" r="8" fill="#ffffff" stroke="none" data-station-id="900000075925004"/>
        <circle cx="472" cy="808" r="8" fill="#ffffff" stroke="none" data-station-id="900000094862005"/>
        <circle cx="526" cy="848" r="8" fill="#ffffff" stroke="none" data-station-id="900000094862006"/>
        <circle cx="594" cy="900" r="8" fill="#ffffff" stroke="none" data-station-id="900000094862008"/>
        <circle cx="605" cy="925" r="8" fill="#ffffff" stroke="none" data-station-id="900000094862009"/>
        <circle cx="611" cy="978" r="8" fill="#ffffff" stroke="none" data-station-id="900000094862011"/>
        <circle cx="645" cy="986" r="8" fill="#ffffff" stroke="none" data-station-id="900000094862012"/>
        <circle cx="693" cy="996" r="8" fill="#ffffff" stroke="none" data-station-id="900000094862013"/>
        <circle cx="727" cy="1011" r="8" fill="#ffffff" stroke="none" data-station-id="900000094862014"/>
        <circle cx="727" cy="1033" r="8" fill="#ffffff" stroke="none" data-station-id="900000094862015"/>
        <circle cx="727" cy="1058" r="8" fill="#ffffff" stroke="none" data-station-id="900000094862016"/>
        <circle cx="727" cy="1085" r="8" fill="#ffffff" stroke="none" data-station-id="900000094862017"/>
        <circle cx="727" cy="1110" r="8" fill="#ffffff" stroke="none" data-station-id="900000094862018"/>
        <circle cx="727" cy="1134" r="8" fill="#ffffff" stroke="none" data-station-id="900000094862019"/>
        <circle cx="803" cy="1199" r="8" fill="#ffffff" stroke="none" data-station-id="900000094862021"/>
        <circle cx="802" cy="1253" r="8" fill="#ffffff" stroke="none" data-station-id="900000094862022"/>
        <circle cx="802" cy="1311" r="8" fill="#ffffff" stroke="none" data-station-id="900000094862023"/>
        <circle cx="802" cy="1366" r="8" fill="#ffffff" stroke="none" data-station-id="900000094862024"/>
        <circle cx="705" cy="1524" r="8" fill="#ffffff" stroke="none" data-station-id="900000094862027"/>
        <circle cx="706" cy="1657" r="8" fill="#ffffff" stroke="none" data-station-id="900000094862029"/>
        <circle cx="707" cy="1759" r="8" fill="#ffffff" stroke="none" data-station-id="900000094862030"/>
        <circle cx="605" cy="1923" r="8" fill="#ffffff" stroke="none" data-station-id="900000094862032"/>
        <circle cx="558" cy="1983" r="8" fill="#ffffff" stroke="none" data-station-id="900000094862033"/>
        <circle cx="1019" cy="1734" r="8" fill="#ffffff" stroke="none" data-station-id="900000094840001"/>
        <circle cx="933" cy="1691" r="8" fill="#ffffff" stroke="none" data-station-id="900000094840002"/>
        <circle cx="908" cy="1385" r="8" fill="#ffffff" stroke="none" data-station-id="900000094840007"/>
        <circle cx="1822" cy="1044" r="8" fill="#ffffff" stroke="none" data-station-id="900000095033015"/>
        <circle cx="1977" cy="849" r="8" fill="#ffffff" stroke="none" data-station-id="900000095033013"/>
        <circle cx="2033" cy="806" r="8" fill="#ffffff" stroke="none" data-station-id="900000095033018"/>
        <circle cx="2089" cy="763" r="8" fill="#ffffff" stroke="none" data-station-id="900000095033011"/>
        <circle cx="2145" cy="721" r="8" fill="#ffffff" stroke="none" data-station-id="900000095033010"/>
        <circle cx="2344" cy="703" r="8" fill="#ffffff" stroke="none" data-station-id="900000095033019"/>
        <circle cx="2432" cy="703" r="8" fill="#ffffff" stroke="none" data-station-id="900000095033008"/>
        <circle cx="2521" cy="703" r="8" fill="#ffffff" stroke="none" data-station-id="900000095033007"/>
        <circle cx="2609" cy="704" r="8" fill="#ffffff" stroke="none" data-station-id="900000095033006"/>
        <circle cx="2675" cy="676" r="8" fill="#ffffff" stroke="none" data-station-id="900000095033005"/>
        <circle cx="2742" cy="625" r="8" fill="#ffffff" stroke="none" data-station-id="900000095033004"/>
        <circle cx="2809" cy="574" r="8" fill="#ffffff" stroke="none" data-station-id="900000095033003"/>
        <circle cx="2940" cy="472" r="8" fill="#ffffff" stroke="none" data-station-id="900000095033002"/>
        <circle cx="2999" cy="424" r="8" fill="#ffffff" stroke="none" data-station-id="900000095033001"/>
        <circle cx="2346" cy="1143" r="8" fill="#ffffff" stroke="none" data-station-id="900000095071025"/>
        <circle cx="2346" cy="1097" r="8" fill="#ffffff" stroke="none" data-station-id="900000095071026"/>
        <circle cx="2346" cy="1056" r="8" fill="#ffffff" stroke="none" data-station-id="900000095071027"/>
        <circle cx="2347" cy="1000" r="8" fill="#ffffff" stroke="none" data-station-id="900000095071028"/>
        <circle cx="2347" cy="946" r="8" fill="#ffffff" stroke="none" data-station-id="900000095071029"/>
        <circle cx="2347" cy="898" r="8" fill="#ffffff" stroke="none" data-station-id="900000095071030"/>
        <circle cx="2346" cy="847" r="8" fill="#ffffff" stroke="none" data-station-id="900000095071031"/>
        <circle cx="2346" cy="790" r="8" fill="#ffffff" stroke="none" data-station-id="900000095071032"/>
        <circle cx="2201" cy="664" r="8" fill="#ffffff" stroke="none" data-station-id="900000095071002"/>
        <circle cx="2152" cy="627" r="8" fill="#ffffff" stroke="none" data-station-id="900000095071003"/>
        <circle cx="2135" cy="573" r="8" fill="#ffffff" stroke="none" data-station-id="900000095071004"/>
        <circle cx="2145" cy="525" r="8" fill="#ffffff" stroke="none" data-station-id="900000095071005"/>
        <circle cx="2204" cy="518" r="8" fill="#ffffff" stroke="none" data-station-id="900000095071006"/>
        <circle cx="2274" cy="518" r="8" fill="#ffffff" stroke="none" data-station-id="900000095071007"/>
        <circle cx="2342" cy="517" r="8" fill="#ffffff" stroke="none" data-station-id="900000095071008"/>
        <circle cx="2412" cy="517" r="8" fill="#ffffff" stroke="none" data-station-id="900000095071009"/>
        <circle cx="2505" cy="559" r="8" fill="#ffffff" stroke="none" data-station-id="900000095071011"/>
        <circle cx="2529" cy="559" r="8" fill="#ffffff" stroke="none" data-station-id="900000095071012"/>
        <circle cx="2576" cy="560" r="8" fill="#ffffff" stroke="none" data-station-id="900000095071013"/>
        <circle cx="2647" cy="569" r="8" fill="#ffffff" stroke="none" data-station-id="900000095071014"/>
        <circle cx="2654" cy="606" r="8" fill="#ffffff" stroke="none" data-station-id="900000095071015"/>
        <circle cx="2654" cy="642" r="8" fill="#ffffff" stroke="none" data-station-id="900000095071016"/>
        <circle cx="2707" cy="703" r="8" fill="#ffffff" stroke="none" data-station-id="900000095071018"/>
        <circle cx="2774" cy="703" r="8" fill="#ffffff" stroke="none" data-station-id="900000095071019"/>
        <circle cx="2829" cy="704" r="8" fill="#ffffff" stroke="none" data-station-id="900000095071020"/>
        <circle cx="2887" cy="704" r="8" fill="#ffffff" stroke="none" data-station-id="900000095071021"/>
        <circle cx="2943" cy="704" r="8" fill="#ffffff" stroke="none" data-station-id="900000095071022"/>
        <circle cx="2998" cy="704" r="8" fill="#ffffff" stroke="none" data-station-id="900000095071023"/>
        <circle cx="3055" cy="704" r="8" fill="#ffffff" stroke="none" data-station-id="900000095071024"/>
        <circle cx="405" cy="843" r="8" fill="#ffffff" stroke="none" data-station-id="900000075925003"/>
        <circle cx="405" cy="638" r="8" fill="#ffffff" stroke="none" data-station-id="900000075925006"/>
    </g>
    <g id="g-station-names">
    <text x="1943" y="1559" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">罗湖</text>
    <text x="1943" y="1434" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">国贸</text>
    <text x="1943" y="1258" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">老街</text>
    <text x="1878" y="1354" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">大剧院</text>
    <text x="1752" y="1449" text-anchor="middle" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">科学馆</text>
    <text x="1700" y="1449" text-anchor="middle" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">华强路</text>
    <text x="1576" y="1419" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">岗厦</text>
    <text x="1485" y="1419" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">会展中心</text>
    <text x="1375" y="1419" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">购物公园</text>
    <text x="1353" y="1449" text-anchor="middle" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">香蜜湖</text>
    <text x="1253" y="1449" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">车公庙</text>
    <text x="1243" y="1419" text-anchor="middle" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">竹子林</text>
    <text x="1186" y="1449" text-anchor="middle" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">侨城东</text>
    <text x="1123" y="1449" text-anchor="middle" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">华侨城</text>
    <text x="1050" y="1419" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">世界之窗</text>
    <text x="1002" y="1419" text-anchor="middle" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">白石洲</text>
    <text x="952" y="1419" text-anchor="middle" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">高新园</text>
    <text x="874" y="1449" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">深大</text>
    <text x="811" y="1449" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">桃园</text>
    <text x="743" y="1419" text-anchor="middle" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">大新</text>
    <text x="684" y="1419" text-anchor="middle" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">鲤鱼门</text>
    <text x="495" y="1449" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">前海湾</text>
    <text x="636" y="1373" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">新安</text>
    <text x="636" y="1320" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">宝安中心</text>
    <text x="560" y="1270" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">宝体</text>
    <text x="560" y="1217" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">坪洲</text>
    <text x="559" y="1162" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">西乡</text>
    <text x="559" y="1106" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">固戍</text>
    <text x="559" y="1051" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">后瑞</text>
    <text x="553" y="955" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">机场东</text>
    <text x="2801" y="771" text-anchor="middle" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">比亚迪北</text>
    <text x="2795" y="693" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">龙背</text>
    <text x="2766" y="670" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">自然博物馆西</text>
    <text x="2761" y="623" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">未来城</text>
    <text x="2841" y="649" text-anchor="middle" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">燕子岭</text>
    <text x="3010" y="612" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">综合保税区</text>
    <text x="2959" y="528" text-anchor="middle" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">中芯国际</text>
    <text x="2877" y="501" text-anchor="middle" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">坪山中心(云巴1号线)</text>
    <text x="2809" y="539" text-anchor="middle" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">文化聚落</text>
    <text x="2746" y="547" text-anchor="middle" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">站前路东</text>
    <text x="2657" y="533" text-anchor="middle" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">坪山高铁站</text>
    <text x="485" y="1832" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">赤湾</text>
    <text x="579" y="1866" text-anchor="middle" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">蛇口港</text>
    <text x="608" y="1836" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">海上世界</text>
    <text x="745" y="1866" text-anchor="middle" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">水湾</text>
    <text x="822" y="1866" text-anchor="middle" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">东角头</text>
    <text x="876" y="1807" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">湾厦</text>
    <text x="876" y="1755" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">海月</text>
    <text x="876" y="1700" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">登良</text>
    <text x="835" y="1622" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">后海</text>
    <text x="918" y="1509" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">科苑</text>
    <text x="995" y="1478" text-anchor="middle" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">红树湾</text>
    <text x="1046" y="1323" text-anchor="middle" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">侨城北</text>
    <text x="1088" y="1353" text-anchor="middle" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">深康</text>
    <text x="1127" y="1353" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">安托山</text>
    <text x="1194" y="1323" text-anchor="middle" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">侨香</text>
    <text x="1224" y="1323" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">香蜜</text>
    <text x="1258" y="1354" text-anchor="middle" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">香梅北</text>
    <text x="1310" y="1324" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">景田</text>
    <text x="1365" y="1354" text-anchor="middle" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">莲花西</text>
    <text x="1400" y="1324" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">福田</text>
    <text x="1485" y="1324" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">市民中心</text>
    <text x="1520" y="1354" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">岗厦北</text>
    <text x="1669" y="1324" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">华强北</text>
    <text x="1759" y="1324" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">燕南</text>
    <text x="1986" y="1354" text-anchor="middle" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">湖贝</text>
    <text x="2062" y="1354" text-anchor="middle" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">黄贝岭</text>
    <text x="2127" y="1354" text-anchor="middle" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">新秀</text>
    <text x="2199" y="1325" text-anchor="middle" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">莲塘口岸</text>
    <text x="2278" y="1355" text-anchor="middle" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">仙湖路</text>
    <text x="2348" y="1325" text-anchor="middle" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">莲塘</text>
    <text x="2427" y="1355" text-anchor="middle" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">梧桐山南</text>
    <text x="2510" y="1326" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">沙头角</text>
    <text x="2554" y="1291" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">海山</text>
    <text x="2597" y="1256" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">盐田港西</text>
    <text x="2649" y="1214" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">深外高中</text>
    <text x="2649" y="1166" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">盐田路</text>
    <text x="2780" y="1151" text-anchor="middle" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">鸿安围</text>
    <text x="2866" y="1181" text-anchor="middle" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">盐田墟</text>
    <text x="2944" y="1151" text-anchor="middle" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">大梅沙</text>
    <text x="3029" y="1182" text-anchor="middle" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">小梅沙</text>
    <text x="1399" y="1748" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">福保</text>
    <text x="1398" y="1654" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">益田</text>
    <text x="1399" y="1522" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">石厦</text>
    <text x="1429" y="1258" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">少年宫</text>
    <text x="1521" y="1243" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">莲花村</text>
    <text x="1667" y="1243" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">华新</text>
    <text x="1709" y="1273" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">通新岭</text>
    <text x="1850" y="1243" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">红岭</text>
    <text x="1899" y="1208" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">晒布</text>
    <text x="1899" y="1156" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">翠竹</text>
    <text x="1943" y="1086" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">田贝</text>
    <text x="1899" y="1053" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">水贝</text>
    <text x="1899" y="1003" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">草埔</text>
    <text x="1943" y="949" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">布吉</text>
    <text x="1986" y="932" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">木棉湾</text>
    <text x="2020" y="905" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">大芬</text>
    <text x="2055" y="879" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">丹竹头</text>
    <text x="2090" y="853" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">六约</text>
    <text x="2124" y="828" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">塘坑</text>
    <text x="2158" y="802" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">横岗</text>
    <text x="2193" y="776" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">永湖</text>
    <text x="2227" y="749" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">荷坳</text>
    <text x="2263" y="722" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">大运</text>
    <text x="2261" y="661" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">爱联</text>
    <text x="2305" y="628" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">吉祥</text>
    <text x="2323" y="595" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">龙城广场</text>
    <text x="2390" y="562" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">南联</text>
    <text x="2434" y="544" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">双龙</text>
    <text x="2510" y="517" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">梨园</text>
    <text x="2546" y="489" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">新生</text>
    <text x="2589" y="457" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">坪西</text>
    <text x="2629" y="425" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">低碳城</text>
    <text x="2670" y="392" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">白石塘</text>
    <text x="2715" y="358" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">富坪</text>
    <text x="2761" y="321" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">坪地六联</text>
    <text x="1489" y="1634" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">福田口岸</text>
    <text x="1489" y="1537" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">福民</text>
    <text x="1429" y="1196" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">莲花北</text>
    <text x="1485" y="1121" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">上梅林</text>
    <text x="1441" y="1079" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">民乐</text>
    <text x="1480" y="1014" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">白石龙</text>
    <text x="1359" y="962" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">深圳北站</text>
    <text x="1441" y="868" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">红山</text>
    <text x="1485" y="809" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">上塘</text>
    <text x="1441" y="783" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">龙胜</text>
    <text x="1440" y="759" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">龙华</text>
    <text x="1509" y="714" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">清湖</text>
    <text x="1530" y="681" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">清湖北</text>
    <text x="1558" y="639" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">竹村</text>
    <text x="1587" y="593" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">茜坑</text>
    <text x="1608" y="559" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">长湖</text>
    <text x="1638" y="510" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">观澜</text>
    <text x="1656" y="465" text-anchor="middle" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">松元厦</text>
    <text x="1725" y="465" text-anchor="middle" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">观澜湖</text>
    <text x="1815" y="466" text-anchor="middle" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">牛湖</text>
    <text x="500" y="1761" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">荔湾</text>
    <text x="477" y="1703" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">铁路公园</text>
    <text x="503" y="1653" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">妈湾</text>
    <text x="480" y="1601" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">前湾公园</text>
    <text x="504" y="1566" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">前湾</text>
    <text x="506" y="1483" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">桂湾</text>
    <text x="552" y="1390" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">临海</text>
    <text x="542" y="1352" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">宝华</text>
    <text x="693" y="1263" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">翻身</text>
    <text x="796" y="1160" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">灵芝</text>
    <text x="977" y="977" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">洪浪北</text>
    <text x="1045" y="932" text-anchor="middle" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">兴东</text>
    <text x="1128" y="962" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">留仙洞</text>
    <text x="1200" y="932" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">西丽</text>
    <text x="1267" y="962" text-anchor="middle" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">大学城</text>
    <text x="1307" y="932" text-anchor="middle" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">塘朗</text>
    <text x="1362" y="932" text-anchor="middle" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">长岭陂</text>
    <text x="1536" y="934" text-anchor="middle" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">民治</text>
    <text x="1583" y="933" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">五和</text>
    <text x="1648" y="934" text-anchor="middle" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">坂田</text>
    <text x="1704" y="934" text-anchor="middle" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">杨美</text>
    <text x="1766" y="934" text-anchor="middle" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">上水径</text>
    <text x="1821" y="934" text-anchor="middle" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">下水径</text>
    <text x="1877" y="934" text-anchor="middle" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">长龙</text>
    <text x="2048" y="1059" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">百鸽笼</text>
    <text x="2072" y="1149" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">布心</text>
    <text x="2072" y="1218" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">太安</text>
    <text x="2072" y="1285" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">怡景</text>
    <text x="668" y="575" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">松岗</text>
    <text x="716" y="586" text-anchor="middle" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">溪头</text>
    <text x="770" y="616" text-anchor="middle" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">松岗公园</text>
    <text x="828" y="587" text-anchor="middle" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">薯田埔</text>
    <text x="884" y="617" text-anchor="middle" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">合水口</text>
    <text x="938" y="587" text-anchor="middle" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">公明广场</text>
    <text x="991" y="617" text-anchor="middle" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">红花山</text>
    <text x="1049" y="587" text-anchor="middle" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">楼村</text>
    <text x="1090" y="617" text-anchor="middle" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">科学公园</text>
    <text x="1121" y="645" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">光明</text>
    <text x="1200" y="637" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">光明大街</text>
    <text x="1182" y="690" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">凤凰城</text>
    <text x="1234" y="715" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">长圳</text>
    <text x="1274" y="738" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">上屋</text>
    <text x="1314" y="763" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">官田</text>
    <text x="1329" y="787" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">阳台山东</text>
    <text x="1398" y="814" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">元芬</text>
    <text x="1509" y="854" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">上芬</text>
    <text x="1370" y="1049" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">梅林关</text>
    <text x="1601" y="1083" text-anchor="middle" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">翰岭</text>
    <text x="1615" y="1053" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">银湖</text>
    <text x="1767" y="1117" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">八卦岭</text>
    <text x="1766" y="1196" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">体育中心</text>
    <text x="1094" y="772" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">光明城站</text>
    <text x="1095" y="732" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">虹桥公园</text>
    <text x="1120" y="683" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">碧眼</text>
    <text x="1122" y="557" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">圳美</text>
    <text x="1213" y="515" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">中大</text>
    <text x="1262" y="440" text-anchor="middle" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">深理工</text>
    <text x="1326" y="909" text-anchor="middle" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">北大</text>
    <text x="1295" y="879" text-anchor="middle" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">西丽湖</text>
    <text x="1197" y="991" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">茶光</text>
    <text x="1182" y="1059" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">珠光</text>
    <text x="1183" y="1117" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">龙井</text>
    <text x="1183" y="1186" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">桃源村</text>
    <text x="1183" y="1257" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">深云</text>
    <text x="1243" y="1382" text-anchor="middle" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">农林</text>
    <text x="1346" y="1552" text-anchor="middle" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">上沙</text>
    <text x="1391" y="1552" text-anchor="middle" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">沙尾</text>
    <text x="1454" y="1552" text-anchor="middle" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">皇岗村</text>
    <text x="1567" y="1588" text-anchor="middle" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">皇岗口岸</text>
    <text x="1669" y="1518" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">赤尾</text>
    <text x="1669" y="1480" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">华强南</text>
    <text x="1648" y="1144" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">黄木岗</text>
    <text x="1851" y="1116" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">红岭北</text>
    <text x="1866" y="1086" text-anchor="middle" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">笋岗</text>
    <text x="1901" y="1086" text-anchor="middle" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">洪湖</text>
    <text x="1361" y="879" text-anchor="middle" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">深大丽湖</text>
    <text x="565" y="1551" text-anchor="middle" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">梦海</text>
    <text x="599" y="1581" text-anchor="middle" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">怡海</text>
    <text x="628" y="1551" text-anchor="middle" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">荔林</text>
    <text x="667" y="1582" text-anchor="middle" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">南油西</text>
    <text x="717" y="1582" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">南油</text>
    <text x="729" y="1561" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">南山书城</text>
    <text x="793" y="1510" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">深大南</text>
    <text x="862" y="1473" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">粤海门</text>
    <text x="951" y="1463" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">高新南</text>
    <text x="986" y="1568" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">红树湾南</text>
    <text x="1083" y="1568" text-anchor="middle" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">深湾</text>
    <text x="1145" y="1568" text-anchor="middle" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">深圳湾公园</text>
    <text x="1214" y="1568" text-anchor="middle" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">下沙</text>
    <text x="1309" y="1382" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">香梅</text>
    <text x="1310" y="1212" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">梅景</text>
    <text x="1354" y="1121" text-anchor="middle" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">下梅林</text>
    <text x="1412" y="1121" text-anchor="middle" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">梅村</text>
    <text x="1579" y="1151" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">孖岭</text>
    <text x="1816" y="990" text-anchor="middle" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">泥岗</text>
    <text x="1851" y="1178" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">园岭</text>
    <text x="1850" y="1436" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">红岭南</text>
    <text x="1876" y="1524" text-anchor="middle" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">鹿丹村</text>
    <text x="1908" y="1494" text-anchor="middle" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">人民南</text>
    <text x="2038" y="1453" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">向西村</text>
    <text x="2038" y="1381" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">文锦</text>
    <text x="1846" y="571" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">双拥街</text>
    <text x="1846" y="612" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">平湖</text>
    <text x="1847" y="653" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">禾花</text>
    <text x="1847" y="693" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">华南城</text>
    <text x="1847" y="728" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">木古</text>
    <text x="1847" y="753" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">上李朗</text>
    <text x="1806" y="780" text-anchor="middle" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">凉帽山</text>
    <text x="1754" y="779" text-anchor="middle" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">甘坑</text>
    <text x="1698" y="779" text-anchor="middle" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">雪象</text>
    <text x="1646" y="779" text-anchor="middle" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">岗头</text>
    <text x="1587" y="810" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">华为</text>
    <text x="1585" y="861" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">贝尔路</text>
    <text x="1584" y="905" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">坂田北</text>
    <text x="1582" y="977" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">光雅园</text>
    <text x="1581" y="1003" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">南坑</text>
    <text x="1580" y="1036" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">雅宝</text>
    <text x="1522" y="1200" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">冬瓜岭</text>
    <text x="624" y="545" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">碧头</text>
    <text x="624" y="640" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">后亭</text>
    <text x="624" y="683" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">沙井</text>
    <text x="612" y="729" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">马安山</text>
    <text x="625" y="775" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">塘尾</text>
    <text x="621" y="859" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">桥头</text>
    <text x="541" y="890" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">福永</text>
    <text x="547" y="923" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">机场北</text>
    <text x="455" y="1005" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">机场</text>
    <text x="444" y="1126" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">碧海湾</text>
    <text x="458" y="1248" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">宝安</text>
    <text x="715" y="1509" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">南山</text>
    <text x="1612" y="1372" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">福星</text>
    <text x="594" y="590" text-anchor="middle" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">朗下</text>
    <text x="544" y="602" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">步涌</text>
    <text x="489" y="614" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">沙井古墟</text>
    <text x="444" y="592" text-anchor="middle" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">沙蚝</text>
    <text x="394" y="621" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">蚝乡</text>
    <text x="437" y="645" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">海上田园东</text>
    <text x="438" y="671" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">海上田园南</text>
    <text x="369" y="701" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">国展北</text>
    <text x="382" y="763" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">国展</text>
    <text x="482" y="798" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">福海西</text>
    <text x="536" y="838" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">桥头西</text>
    <text x="604" y="905" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">怀德</text>
    <text x="615" y="930" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">福围</text>
    <text x="621" y="968" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">兴围</text>
    <text x="645" y="1006" text-anchor="middle" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">黄田</text>
    <text x="693" y="986" text-anchor="middle" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">钟屋南</text>
    <text x="737" y="1016" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">西乡桃源</text>
    <text x="681" y="1038" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">平峦山</text>
    <text x="737" y="1063" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">宝田一路</text>
    <text x="657" y="1090" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">宝安客运站</text>
    <text x="737" y="1115" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">流塘</text>
    <text x="693" y="1139" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">上川</text>
    <text x="813" y="1204" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">新安公园</text>
    <text x="812" y="1258" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">同乐南</text>
    <text x="812" y="1316" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">中山公园</text>
    <text x="812" y="1371" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">南头古城</text>
    <text x="671" y="1529" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">南光</text>
    <text x="716" y="1662" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">四海</text>
    <text x="661" y="1764" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">花果山</text>
    <text x="615" y="1943" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">太子湾</text>
    <text x="558" y="2003" text-anchor="middle" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">左炮台东</text>
    <text x="1029" y="1739" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">深圳湾口岸</text>
    <text x="943" y="1696" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">人才公园</text>
    <text x="918" y="1390" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">高新中</text>
    <text x="1776" y="1049" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">罗湖北</text>
    <text x="1931" y="839" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">石芽岭</text>
    <text x="1987" y="796" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">六约北</text>
    <text x="2055" y="753" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">四联</text>
    <text x="2111" y="711" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">坳背</text>
    <text x="2344" y="723" text-anchor="middle" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">嶂背</text>
    <text x="2432" y="723" text-anchor="middle" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">南约</text>
    <text x="2521" y="723" text-anchor="middle" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">宝龙</text>
    <text x="2609" y="724" text-anchor="middle" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">锦龙</text>
    <text x="2629" y="681" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">坪山围</text>
    <text x="2684" y="630" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">坪山广场</text>
    <text x="2819" y="594" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">坪山中心</text>
    <text x="2950" y="477" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">坑梓</text>
    <text x="3009" y="429" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">沙田</text>
    <text x="2356" y="1148" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">园山西坑</text>
    <text x="2356" y="1102" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">安良</text>
    <text x="2356" y="1061" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">福坑</text>
    <text x="2357" y="1005" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">大康</text>
    <text x="2357" y="951" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">园山</text>
    <text x="2357" y="903" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">大安</text>
    <text x="2356" y="852" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">吉溪</text>
    <text x="2356" y="795" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">金源</text>
    <text x="2143" y="669" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">大运中心</text>
    <text x="2162" y="632" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">龙城公园</text>
    <text x="2145" y="578" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">黄阁坑</text>
    <text x="2111" y="515" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">愉园</text>
    <text x="2204" y="538" text-anchor="middle" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">回龙埔</text>
    <text x="2274" y="508" text-anchor="middle" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">尚景</text>
    <text x="2342" y="537" text-anchor="middle" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">盛平</text>
    <text x="2412" y="507" text-anchor="middle" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">龙园</text>
    <text x="2459" y="579" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">新塘围</text>
    <text x="2529" y="579" text-anchor="middle" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">龙东</text>
    <text x="2576" y="550" text-anchor="middle" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">宝龙同乐</text>
    <text x="2613" y="589" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">坪山</text>
    <text x="2620" y="611" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">新和</text>
    <text x="2620" y="647" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">六和</text>
    <text x="2717" y="693" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">坪环</text>
    <text x="2704" y="723" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">东纵纪念馆</text>
    <text x="2829" y="724" text-anchor="middle" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">沙壆</text>
    <text x="2887" y="694" text-anchor="middle" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">燕子湖</text>
    <text x="2943" y="724" text-anchor="middle" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">石井</text>
    <text x="2998" y="694" text-anchor="middle" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">技术大学</text>
    <text x="3065" y="709" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">田心</text>
    <text x="359" y="848" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">国展南</text>
    <text x="359" y="643" text-anchor="left" fill="#ffffff" font-size="12" font-family="Arial, sans-serif">会展城</text>
    </g>
`;
