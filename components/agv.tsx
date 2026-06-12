import React from 'react';

const rankData = [
    {orderId: "P_C_038", orderType: "计划反向", agvId: "Slot_130 (坪山围)", flightSegment: "起始段(送货上车)", bindTrain: "T_B_00", boardingStop: "坪山围", boardingTime: "10:25:00", AlightingStop: "回龙埔", alightingTime: "10:30:00"},
    {orderId: "P_C_038", orderType: "计划反向", agvId: "Slot_061 (龙城公园)", flightSegment: "结束段(提前上车接货)", bindTrain: "T_B_00", boardingStop: "龙城公园", boardingTime: "10:34:00", AlightingStop: "大运", alightingTime: "10:38:00"},
    {orderId: "P_C_002", orderType: "计划正向", agvId: "Slot_003 (大运)", flightSegment: "起始段(送货上车)", bindTrain: "T_F_00", boardingStop: "大运", boardingTime: "10:00:00", AlightingStop: "龙城公园", alightingTime: "10:04:00"},
    {orderId: "P_C_002", orderType: "计划正向", agvId: "Slot_006 (大运)", flightSegment: "结束段(提前上车接货)", bindTrain: "T_F_00", boardingStop: "大运", boardingTime: "10:00:00", AlightingStop: "龙城公园", alightingTime: "10:04:00"},
    {orderId: "P_C_018", orderType: "计划反向", agvId: "Slot_060 (龙城公园)", flightSegment: "起始段(送货上车)", bindTrain: "T_B_00", boardingStop: "龙城公园", boardingTime: "10:34:00", AlightingStop: "大运", alightingTime: "10:38:00"},
    {orderId: "P_C_018", orderType: "计划反向", agvId: "Slot_062 (龙城公园)", flightSegment: "结束段(提前上车接货)", bindTrain: "T_B_00", boardingStop: "龙城公园", boardingTime: "10:34:00", AlightingStop: "大运", alightingTime: "10:38:00"},
    {orderId: "P_C_024", orderType: "计划正向", agvId: "Slot_047 (龙城公园)", flightSegment: "起始段(送货上车)", bindTrain: "T_F_00", boardingStop: "龙城公园", boardingTime: "10:04:00", AlightingStop: "回龙埔", alightingTime: "10:08:00"},
    {orderId: "P_C_024", orderType: "计划正向", agvId: "Slot_083 (回龙埔)", flightSegment: "结束段(提前上车接货)", bindTrain: "T_F_00", boardingStop: "回龙埔", boardingTime: "10:08:00", AlightingStop: "坪山围", alightingTime: "10:13:00"},
    {orderId: "P_C_017", orderType: "计划反向", agvId: "Slot_066 (龙城公园)", flightSegment: "起始段(送货上车)", bindTrain: "T_B_00", boardingStop: "龙城公园", boardingTime: "10:34:00", AlightingStop: "大运", alightingTime: "10:38:00"},
    {orderId: "P_C_017", orderType: "计划反向", agvId: "Slot_067 (龙城公园)", flightSegment: "结束段(提前上车接货)", bindTrain: "T_B_00", boardingStop: "龙城公园", boardingTime: "10:34:00", AlightingStop: "大运", alightingTime: "10:38:00"},
    {orderId: "P_C_014", orderType: "计划正向", agvId: "Slot_009 (大运)", flightSegment: "起始段(送货上车)", bindTrain: "T_F_00", boardingStop: "大运", boardingTime: "10:00:00", AlightingStop: "龙城公园", alightingTime: "10:04:00"},
    {orderId: "P_C_014", orderType: "计划正向", agvId: "Slot_139 (坪山围)", flightSegment: "结束段(提前上车接货)", bindTrain: "T_F_00", boardingStop: "坪山围", boardingTime: "10:13:00", AlightingStop: "燕子湖", alightingTime: "10:18:00"},
    {orderId: "P_C_019", orderType: "计划反向", agvId: "Slot_077 (龙城公园)", flightSegment: "起始段(送货上车)", bindTrain: "T_B_00", boardingStop: "龙城公园", boardingTime: "10:34:00", AlightingStop: "大运", alightingTime: "10:38:00"},
    {orderId: "P_C_019", orderType: "计划反向", agvId: "Slot_078 (龙城公园)", flightSegment: "结束段(提前上车接货)", bindTrain: "T_B_00", boardingStop: "龙城公园", boardingTime: "10:34:00", AlightingStop: "大运", alightingTime: "10:38:00"},
    {orderId: "P_C_009", orderType: "计划正向", agvId: "Slot_022 (大运)", flightSegment: "起始段(送货上车)", bindTrain: "T_F_00", boardingStop: "大运", boardingTime: "10:00:00", AlightingStop: "龙城公园", alightingTime: "10:04:00"},
    {orderId: "P_C_009", orderType: "计划正向", agvId: "Slot_114 (回龙埔)", flightSegment: "结束段(提前上车接货)", bindTrain: "T_F_00", boardingStop: "回龙埔", boardingTime: "10:08:00", AlightingStop: "坪山围", alightingTime: "10:13:00"},
    {orderId: "P_C_050" , orderType: "计划反向", agvId: "Slot_164 (燕子湖)", flightSegment: "起始段(送货上车)", bindTrain: "T_B_00", boardingStop: "燕子湖", boardingTime: "10:20:00", AlightingStop: "坪山围", alightingTime: "10:25:00"},
    {orderId: "P_C_050", orderType: "计划反向", agvId: "Slot_131 (坪山围)", flightSegment: "结束段(提前上车接货)", bindTrain: "T_B_00", boardingStop: "坪山围", boardingTime: "10:25:00", AlightingStop: "回龙埔", alightingTime: "10:30:00"},
    {orderId: "P_C_001", orderType: "计划正向", agvId: "Slot_018 (大运)", flightSegment: "起始段(送货上车)", bindTrain: "T_F_00", boardingStop: "大运", boardingTime: "10:00:00", AlightingStop: "龙城公园", alightingTime: "10:04:00"},
    {orderId: "P_C_001", orderType: "计划正向", agvId: "Slot_019 (大运)", flightSegment: "结束段(提前上车接货)", bindTrain: "T_F_00", boardingStop: "大运", boardingTime: "10:00:00", AlightingStop: "龙城公园", alightingTime: "10:04:00"},
    {orderId: "P_C_007", orderType: "计划正向", agvId: "Slot_025 (大运)", flightSegment: "起始段(送货上车)", bindTrain: "T_F_00", boardingStop: "大运", boardingTime: "10:00:00", AlightingStop: "龙城公园", alightingTime: "10:04:00"},
    {orderId: "P_C_007", orderType: "计划正向", agvId: "Slot_076 (龙城公园)", flightSegment: "结束段(提前上车接货)", bindTrain: "T_F_00", boardingStop: "龙城公园", boardingTime: "10:04:00", AlightingStop: "回龙埔", alightingTime: "10:08:00"},
    {orderId: "P_C_046", orderType: "计划正向", agvId: "Slot_117 (坪山围)", flightSegment: "起始段(送货上车)", bindTrain: "T_F_00", boardingStop: "坪山围", boardingTime: "10:13:00", AlightingStop: "燕子湖", alightingTime: "10:18:00"},
    {orderId: "P_C_046", orderType: "计划正向", agvId: "Slot_160 (燕子湖)", flightSegment: "结束段(提前上车接货)", bindTrain: "T_F_00", boardingStop: "燕子湖", boardingTime: "10:18:00", AlightingStop: "技术大学", alightingTime: "10:23:00"},
    {orderId: "P_C_041", orderType: "计划反向", agvId: "Slot_128 (坪山围)", flightSegment: "起始段(送货上车)", bindTrain: "T_B_00", boardingStop: "坪山围", boardingTime: "10:25:00", AlightingStop: "回龙埔", alightingTime: "10:30:00"},
    {orderId: "P_C_041", orderType: "计划反向", agvId: "Slot_098 (回龙埔)", flightSegment: "结束段(提前上车接货)", bindTrain: "T_B_00", boardingStop: "回龙埔", boardingTime: "10:30:00", AlightingStop: "龙城公园", alightingTime: "10:34:00"},
    {orderId: "P_C_026", orderType: "计划正向", agvId: "Slot_073 (龙城公园)", flightSegment: "起始段(送货上车)", bindTrain: "T_F_00", boardingStop: "龙城公园", boardingTime: "10:04:00", AlightingStop: "回龙埔", alightingTime: "10:08:00"},
    {orderId: "P_C_026", orderType: "计划正向", agvId: "Slot_138 (坪山围)", flightSegment: "结束段(提前上车接货)", bindTrain: "T_F_00", boardingStop: "坪山围", boardingTime: "10:13:00", AlightingStop: "燕子湖", alightingTime: "10:18:00"},
    {orderId: "P_C_020", orderType: "计划反向", agvId: "Slot_068 (龙城公园)", flightSegment: "起始段(送货上车)", bindTrain: "T_B_00", boardingStop: "龙城公园", boardingTime: "10:34:00", AlightingStop: "大运", alightingTime: "10:38:00"},
    {orderId: "P_C_020", orderType: "计划反向", agvId: "Slot_069 (龙城公园)", flightSegment: "结束段(提前上车接货)", bindTrain: "T_B_00", boardingStop: "龙城公园", boardingTime: "10:34:00", AlightingStop: "大运", alightingTime: "10:38:00"},
    {orderId: "P_C_047", orderType: "计划反向", agvId: "Slot_151 (燕子湖)", flightSegment: "起始段(送货上车)", bindTrain: "T_B_00", boardingStop: "燕子湖", boardingTime: "10:20:00", AlightingStop: "坪山围", alightingTime: "10:25:00"},
    {orderId: "P_C_047", orderType: "计划反向", agvId: "Slot_042 (龙城公园)", flightSegment: "结束段(提前上车接货)", bindTrain: "T_B_00", boardingStop: "龙城公园", boardingTime: "10:34:00", AlightingStop: "大运", alightingTime: "10:38:00"},
    {orderId: "P_C_006", orderType: "计划正向", agvId: "Slot_005 (大运)", flightSegment: "起始段(送货上车)", bindTrain: "T_F_00", boardingStop: "大运", boardingTime: "10:00:00", AlightingStop: "龙城公园", alightingTime: "10:04:00"},
    {orderId: "P_C_006", orderType: "计划正向", agvId: "Slot_035 (龙城公园)", flightSegment: "结束段(提前上车接货)", bindTrain: "T_F_00", boardingStop: "龙城公园", boardingTime: "10:04:00", AlightingStop: "回龙埔", alightingTime: "10:08:00"},
    {orderId: "P_C_032", orderType: "计划反向", agvId: "Slot_102 (回龙埔)", flightSegment: "起始段(送货上车)", bindTrain: "T_B_00", boardingStop: "回龙埔", boardingTime: "10:30:00", AlightingStop: "龙城公园", alightingTime: "10:34:00"},
    {orderId: "P_C_032", orderType: "计划反向", agvId: "Slot_104 (回龙埔)", flightSegment: "结束段(提前上车接货)", bindTrain: "T_B_00", boardingStop: "回龙埔", boardingTime: "10:30:00", AlightingStop: "龙城公园", alightingTime: "10:34:00"},
    {orderId: "P_C_021", orderType: "计划正向", agvId: "Slot_070 (龙城公园)", flightSegment: "起始段(送货上车)", bindTrain: "T_F_00", boardingStop: "龙城公园", boardingTime: "10:04:00", AlightingStop: "回龙埔", alightingTime: "10:08:00"},
    {orderId: "P_C_021", orderType: "计划正向", agvId: "Slot_072 (龙城公园)", flightSegment: "结束段(提前上车接货)", bindTrain: "T_F_00", boardingStop: "龙城公园", boardingTime: "10:04:00", AlightingStop: "回龙埔", alightingTime: "10:08:00"},
    {orderId: "P_C_005", orderType: "计划正向", agvId: "Slot_001 (大运)", flightSegment: "起始段(送货上车)", bindTrain: "T_F_00", boardingStop: "大运", boardingTime: "10:00:00", AlightingStop: "龙城公园", alightingTime: "10:04:00"},
    {orderId: "P_C_005", orderType: "计划正向", agvId: "Slot_036 (龙城公园)", flightSegment: "结束段(提前上车接货)", bindTrain: "T_F_00", boardingStop: "龙城公园", boardingTime: "10:04:00", AlightingStop: "回龙埔", alightingTime: "10:08:00"},
    {orderId: "P_C_058", orderType: "计划反向", agvId: "Slot_174 (技术大学)", flightSegment: "起始段(送货上车)", bindTrain: "T_B_00", boardingStop: "技术大学", boardingTime: "10:15:00", AlightingStop: "燕子湖", alightingTime: "10:20:00"},
    {orderId: "P_C_058", orderType: "计划反向", agvId: "Slot_149 (燕子湖)", flightSegment: "结束段(提前上车接货)", bindTrain: "T_B_00", boardingStop: "燕子湖", boardingTime: "10:20:00", AlightingStop: "坪山围", alightingTime: "10:25:00"},
    {orderId: "P_C_004", orderType: "计划正向", agvId: "Slot_023 (大运)", flightSegment: "起始段(送货上车)", bindTrain: "T_F_00", boardingStop: "大运", boardingTime: "10:00:00", AlightingStop: "龙城公园", alightingTime: "10:04:00"},
    {orderId: "P_C_004", orderType: "计划正向", agvId: "Slot_024 (大运)", flightSegment: "结束段(提前上车接货)", bindTrain: "T_F_00", boardingStop: "大运", boardingTime: "10:00:00", AlightingStop: "龙城公园", alightingTime: "10:04:00"},
    {orderId: "P_C_035", orderType: "计划正向", agvId: "Slot_105 (回龙埔)", flightSegment: "起始段(送货上车)", bindTrain: "T_F_00", boardingStop: "回龙埔", boardingTime: "10:08:00", AlightingStop: "坪山围", alightingTime: "10:13:00"},
    {orderId: "P_C_035", orderType: "计划正向", agvId: "Slot_106 (回龙埔)", flightSegment: "结束段(提前上车接货)", bindTrain: "T_F_00", boardingStop: "回龙埔", boardingTime: "10:08:00", AlightingStop: "坪山围", alightingTime: "10:13:00"},
    {orderId: "P_C_045", orderType: "计划正向", agvId: "Slot_137 (坪山围)", flightSegment: "起始段(送货上车)", bindTrain: "T_F_00", boardingStop: "坪山围", boardingTime: "10:13:00", AlightingStop: "燕子湖", alightingTime: "10:18:00"},
    {orderId: "P_C_045", orderType: "计划正向", agvId: "Slot_152 (燕子湖)", flightSegment: "结束段(提前上车接货)", bindTrain: "T_F_00", boardingStop: "燕子湖", boardingTime: "10:18:00", AlightingStop: "技术大学", alightingTime: "10:23:00"},
    {orderId: "P_C_044", orderType: "计划正向", agvId: "Slot_120 (坪山围)", flightSegment: "起始段(送货上车)", bindTrain: "T_F_00", boardingStop: "坪山围", boardingTime: "10:13:00", AlightingStop: "燕子湖", alightingTime: "10:18:00"},
    {orderId: "P_C_044", orderType: "计划正向", agvId: "Slot_121 (坪山围)", flightSegment: "结束段(提前上车接货)", bindTrain: "T_F_00", boardingStop: "坪山围", boardingTime: "10:13:00", AlightingStop: "燕子湖", alightingTime: "10:18:00"},
    {orderId: "P_C_049", orderType: "计划反向", agvId: "Slot_143 (燕子湖)", flightSegment: "起始段(送货上车)", bindTrain: "T_B_00", boardingStop: "燕子湖", boardingTime: "10:20:00", AlightingStop: "坪山围", alightingTime: "10:25:00"},
    {orderId: "P_C_049", orderType: "计划反向", agvId: "Slot_090 (回龙埔)", flightSegment: "结束段(提前上车接货)", bindTrain: "T_B_00", boardingStop: "回龙埔", boardingTime: "10:30:00", AlightingStop: "龙城公园", alightingTime: "10:34:00"},
    {orderId: "P_C_056", orderType: "计划反向", agvId: "Slot_173 (技术大学)", flightSegment: "起始段(送货上车)", bindTrain: "T_B_00", boardingStop: "技术大学", boardingTime: "10:15:00", AlightingStop: "燕子湖", alightingTime: "10:20:00"},
    {orderId: "P_C_056", orderType: "计划反向", agvId: "Slot_097 (回龙埔)", flightSegment: "结束段(提前上车接货)", bindTrain: "T_B_00", boardingStop: "回龙埔", boardingTime: "10:30:00", AlightingStop: "龙城公园", alightingTime: "10:34:00"},
    {orderId: "P_C_054", orderType: "计划正向", agvId: "Slot_155 (燕子湖)", flightSegment: "起始段(送货上车)", bindTrain: "T_F_00", boardingStop: "燕子湖", boardingTime: "10:18:00", AlightingStop: "技术大学", alightingTime: "10:23:00"},
    {orderId: "P_C_054", orderType: "计划正向", agvId: "Slot_156 (燕子湖)", flightSegment: "结束段(提前上车接货)", bindTrain: "T_F_00", boardingStop: "燕子湖", boardingTime: "10:18:00", AlightingStop: "技术大学", alightingTime: "10:23:00"},
    {orderId: "P_C_031", orderType: "计划反向", agvId: "Slot_080 (回龙埔)", flightSegment: "起始段(送货上车)", bindTrain: "T_B_00", boardingStop: "回龙埔", boardingTime: "10:30:00", AlightingStop: "龙城公园", alightingTime: "10:34:00"},
    {orderId: "P_C_031", orderType: "计划反向", agvId: "Slot_043 (龙城公园)", flightSegment: "结束段(提前上车接货)", bindTrain: "T_B_00", boardingStop: "龙城公园", boardingTime: "10:34:00", AlightingStop: "大运", alightingTime: "10:38:00"},
    {orderId: "P_C_016", orderType: "计划正向", agvId: "Slot_008 (大运)", flightSegment: "起始段(送货上车)", bindTrain: "T_F_00", boardingStop: "大运", boardingTime: "10:00:00", AlightingStop: "龙城公园", alightingTime: "10:04:00"},
    {orderId: "P_C_016", orderType: "计划正向", agvId: "Slot_144 (燕子湖)", flightSegment: "结束段(提前上车接货)", bindTrain: "T_F_00", boardingStop: "燕子湖", boardingTime: "10:18:00", AlightingStop: "技术大学", alightingTime: "10:23:00"},
    {orderId: "P_C_043", orderType: "计划正向", agvId: "Slot_124 (坪山围)", flightSegment: "起始段(送货上车)", bindTrain: "T_F_00", boardingStop: "坪山围", boardingTime: "10:13:00", AlightingStop: "燕子湖", alightingTime: "10:18:00"},
    {orderId: "P_C_043", orderType: "计划正向", agvId: "Slot_125 (坪山围)", flightSegment: "结束段(提前上车接货)", bindTrain: "T_F_00", boardingStop: "坪山围", boardingTime: "10:13:00", AlightingStop: "燕子湖", alightingTime: "10:18:00"},
    {orderId: "P_C_022", orderType: "计划正向", agvId: "Slot_063 (龙城公园)", flightSegment: "起始段(送货上车)", bindTrain: "T_F_01", boardingStop: "龙城公园", boardingTime: "10:14:00", AlightingStop: "回龙埔", alightingTime: "10:18:00"},
    {orderId: "P_C_022", orderType: "计划正向", agvId: "Slot_065 (龙城公园)", flightSegment: "结束段(提前上车接货)", bindTrain: "T_F_01", boardingStop: "龙城公园", boardingTime: "10:14:00", AlightingStop: "回龙埔", alightingTime: "10:18:00"},
    {orderId: "D_C_065", orderType: "动态反向", agvId: "Slot_172 (技术大学)", flightSegment: "起始段(送货上车)", bindTrain: "T_B_00", boardingStop: "技术大学", boardingTime: "10:15:00", AlightingStop: "燕子湖", alightingTime: "10:20:00"},
    {orderId: "D_C_065", orderType: "动态反向", agvId: "Slot_075 (龙城公园)", flightSegment: "结束段(提前上车接货)", bindTrain: "T_B_00", boardingStop: "龙城公园", boardingTime: "10:34:00", AlightingStop: "大运", alightingTime: "10:38:00"},
    {orderId: "P_C_013", orderType: "计划正向", agvId: "Slot_015 (大运)", flightSegment: "起始段(送货上车)", bindTrain: "T_F_02", boardingStop: "大运", boardingTime: "10:20:00", AlightingStop: "龙城公园", alightingTime: "10:24:00"},
    {orderId: "P_C_013", orderType: "计划正向", agvId: "Slot_119 (坪山围)", flightSegment: "结束段(提前上车接货)", bindTrain: "T_F_02", boardingStop: "坪山围", boardingTime: "10:33:00", AlightingStop: "燕子湖", alightingTime: "10:38:00"},
    {orderId: "P_C_030", orderType: "计划反向", agvId: "Slot_101 (回龙埔)", flightSegment: "起始段(送货上车)", bindTrain: "T_B_00", boardingStop: "回龙埔", boardingTime: "10:30:00", AlightingStop: "龙城公园", alightingTime: "10:34:00"},
    {orderId: "P_C_030", orderType: "计划反向", agvId: "Slot_057 (龙城公园)", flightSegment: "结束段(提前上车接货)", bindTrain: "T_B_00", boardingStop: "龙城公园", boardingTime: "10:34:00", AlightingStop: "大运", alightingTime: "10:38:00"},
    {orderId: "P_C_025", orderType: "计划正向", agvId: "Slot_064 (龙城公园)", flightSegment: "起始段(送货上车)", bindTrain: "T_F_02", boardingStop: "龙城公园", boardingTime: "10:24:00", AlightingStop: "回龙埔", alightingTime: "10:28:00"},
    {orderId: "P_C_025", orderType: "计划正向", agvId: "Slot_111 (回龙埔)", flightSegment: "结束段(提前上车接货)", bindTrain: "T_F_02", boardingStop: "回龙埔", boardingTime: "10:28:00", AlightingStop: "坪山围", alightingTime: "10:33:00"},
    {orderId: "P_C_015", orderType: "计划正向", agvId: "Slot_007 (大运)", flightSegment: "起始段(送货上车)", bindTrain: "T_F_02", boardingStop: "大运", boardingTime: "10:20:00", AlightingStop: "龙城公园", alightingTime: "10:24:00"},
    {orderId: "P_C_015", orderType: "计划正向", agvId: "Slot_147 (燕子湖)", flightSegment: "结束段(提前上车接货)", bindTrain: "T_F_02", boardingStop: "燕子湖", boardingTime: "10:38:00", AlightingStop: "技术大学", alightingTime: "10:43:00"},
    {orderId: "P_C_034", orderType: "计划正向", agvId: "Slot_087 (回龙埔)", flightSegment: "起始段(送货上车)", bindTrain: "T_F_02", boardingStop: "回龙埔", boardingTime: "10:28:00", AlightingStop: "坪山围", alightingTime: "10:33:00"},
    {orderId: "P_C_034", orderType: "计划正向", agvId: "Slot_088 (回龙埔)", flightSegment: "结束段(提前上车接货)", bindTrain: "T_F_02", boardingStop: "回龙埔", boardingTime: "10:28:00", AlightingStop: "坪山围", alightingTime: "10:33:00"},
    {orderId: "P_C_023", orderType: "计划正向", agvId: "Slot_053 (龙城公园)", flightSegment: "起始段(送货上车)", bindTrain: "T_F_02", boardingStop: "龙城公园", boardingTime: "10:24:00", AlightingStop: "回龙埔", alightingTime: "10:28:00"},
    {orderId: "P_C_023", orderType: "计划正向", agvId: "Slot_056 (龙城公园)", flightSegment: "结束段(提前上车接货)", bindTrain: "T_F_02", boardingStop: "龙城公园", boardingTime: "10:24:00", AlightingStop: "回龙埔", alightingTime: "10:28:00"},
    {orderId: "P_C_057", orderType: "计划反向", agvId: "Slot_166 (技术大学)", flightSegment: "起始段(送货上车)", bindTrain: "T_B_01", boardingStop: "技术大学", boardingTime: "10:25:00", AlightingStop: "燕子湖", alightingTime: "10:30:00"},
    {orderId: "P_C_057", orderType: "计划反向", agvId: "Slot_116 (坪山围)", flightSegment: "结束段(提前上车接货)", bindTrain: "T_B_01", boardingStop: "坪山围", boardingTime: "10:35:00", AlightingStop: "回龙埔", alightingTime: "10:40:00"},
    {orderId: "D_C_085", orderType: "动态正向", agvId: "Slot_049 (龙城公园)", flightSegment: "起始段(送货上车)", bindTrain: "T_F_02", boardingStop: "龙城公园", boardingTime: "10:24:00", AlightingStop: "回龙埔", alightingTime: "10:28:00"},
    {orderId: "D_C_085", orderType: "动态正向", agvId: "Slot_050 (龙城公园)", flightSegment: "结束段(提前上车接货)", bindTrain: "T_F_02", boardingStop: "龙城公园", boardingTime: "10:24:00", AlightingStop: "回龙埔", alightingTime: "10:28:00"},
    {orderId: "D_C_075", orderType: "动态反向", agvId: "Slot_178 (技术大学)", flightSegment: "起始段(送货上车)", bindTrain: "T_B_01", boardingStop: "技术大学", boardingTime: "10:25:00", AlightingStop: "燕子湖", alightingTime: "10:30:00"},
    {orderId: "D_C_075", orderType: "动态反向", agvId: "Slot_100 (回龙埔)", flightSegment: "结束段(提前上车接货)", bindTrain: "T_B_01", boardingStop: "回龙埔", boardingTime: "10:40:00", AlightingStop: "龙城公园", alightingTime: "10:44:00"},
    {orderId: "P_C_000", orderType: "计划正向", agvId: "Slot_016 (大运)", flightSegment: "起始段(送货上车)", bindTrain: "T_F_03", boardingStop: "大运", boardingTime: "10:30:00", AlightingStop: "龙城公园", alightingTime: "10:34:00"},
    {orderId: "P_C_000", orderType: "计划正向", agvId: "Slot_017 (大运)", flightSegment: "结束段(提前上车接货)", bindTrain: "T_F_03", boardingStop: "大运", boardingTime: "10:30:00", AlightingStop: "龙城公园", alightingTime: "10:34:00"},
    {orderId: "P_C_028", orderType: "计划正向", agvId: "Slot_037 (龙城公园)", flightSegment: "起始段(送货上车)", bindTrain: "T_F_03", boardingStop: "龙城公园", boardingTime: "10:34:00", AlightingStop: "回龙埔", alightingTime: "10:38:00"},
    {orderId: "P_C_028", orderType: "计划正向", agvId: "Slot_148 (燕子湖)", flightSegment: "结束段(提前上车接货)", bindTrain: "T_F_03", boardingStop: "燕子湖", boardingTime: "10:48:00", AlightingStop: "技术大学", alightingTime: "10:53:00"},
    {orderId: "D_C_064", orderType: "动态正向", agvId: "Slot_109 (回龙埔)", flightSegment: "起始段(送货上车)", bindTrain: "T_F_03", boardingStop: "回龙埔", boardingTime: "10:38:00", AlightingStop: "坪山围", alightingTime: "10:43:00"},
    {orderId: "D_C_064", orderType: "动态正向", agvId: "Slot_136 (坪山围)", flightSegment: "结束段(提前上车接货)", bindTrain: "T_F_03", boardingStop: "坪山围", boardingTime: "10:43:00", AlightingStop: "燕子湖", alightingTime: "10:48:00"},
    {orderId: "P_C_010", orderType: "计划正向", agvId: "Slot_004 (大运)", flightSegment: "起始段(送货上车)", bindTrain: "T_F_04", boardingStop: "大运", boardingTime: "10:40:00", AlightingStop: "龙城公园", alightingTime: "10:44:00"},
    {orderId: "P_C_010", orderType: "计划正向", agvId: "Slot_110 (回龙埔)", flightSegment: "结束段(提前上车接货)", bindTrain: "T_F_04", boardingStop: "回龙埔", boardingTime: "10:48:00", AlightingStop: "坪山围", alightingTime: "10:53:00"},
    {orderId: "D_C_081", orderType: "动态反向", agvId: "Slot_103 (回龙埔)", flightSegment: "起始段(送货上车)", bindTrain: "T_B_01", boardingStop: "回龙埔", boardingTime: "10:40:00", AlightingStop: "龙城公园", alightingTime: "10:44:00"},
    {orderId: "D_C_081", orderType: "动态反向", agvId: "Slot_058 (龙城公园)", flightSegment: "结束段(提前上车接货)", bindTrain: "T_B_01", boardingStop: "龙城公园", boardingTime: "10:44:00", AlightingStop: "大运", alightingTime: "10:48:00"},
    {orderId: "D_C_077", orderType: "动态反向", agvId: "Slot_175 (技术大学)", flightSegment: "起始段(送货上车)", bindTrain: "T_B_02", boardingStop: "技术大学", boardingTime: "10:35:00", AlightingStop: "燕子湖", alightingTime: "10:40:00"},
    {orderId: "D_C_077", orderType: "动态反向", agvId: "Slot_176 (技术大学)", flightSegment: "结束段(提前上车接货)", bindTrain: "T_B_02", boardingStop: "技术大学", boardingTime: "10:35:00", AlightingStop: "燕子湖", alightingTime: "10:40:00"},
    {orderId: "P_C_029", orderType: "计划反向", agvId: "Slot_112 (回龙埔)", flightSegment: "起始段(送货上车)", bindTrain: "T_B_01", boardingStop: "回龙埔", boardingTime: "10:40:00", AlightingStop: "龙城公园", alightingTime: "10:44:00"},
    {orderId: "P_C_029", orderType: "计划反向", agvId: "Slot_054 (龙城公园)", flightSegment: "结束段(提前上车接货)", bindTrain: "T_B_01", boardingStop: "龙城公园", boardingTime: "10:44:00", AlightingStop: "大运", alightingTime: "10:48:00"},
    {orderId: "P_C_042", orderType: "计划反向", agvId: "Slot_132 (坪山围)", flightSegment: "起始段(送货上车)", bindTrain: "T_B_01", boardingStop: "坪山围", boardingTime: "10:35:00", AlightingStop: "回龙埔", alightingTime: "10:40:00"},
    {orderId: "P_C_042", orderType: "计划反向", agvId: "Slot_134 (坪山围)", flightSegment: "结束段(提前上车接货)", bindTrain: "T_B_01", boardingStop: "坪山围", boardingTime: "10:35:00", AlightingStop: "回龙埔", alightingTime: "10:40:00"},
    {orderId: "P_C_027", orderType: "计划正向", agvId: "Slot_059 (龙城公园)", flightSegment: "起始段(送货上车)", bindTrain: "T_F_04", boardingStop: "龙城公园", boardingTime: "10:44:00", AlightingStop: "回龙埔", alightingTime: "10:48:00"},
    {orderId: "P_C_027", orderType: "计划正向", agvId: "Slot_118 (坪山围)", flightSegment: "结束段(提前上车接货)", bindTrain: "T_F_04", boardingStop: "坪山围", boardingTime: "10:53:00", AlightingStop: "燕子湖", alightingTime: "10:58:00"},
    {orderId: "P_C_003", orderType: "计划正向", agvId: "Slot_012 (大运)", flightSegment: "起始段(送货上车)", bindTrain: "T_F_04", boardingStop: "大运", boardingTime: "10:40:00", AlightingStop: "龙城公园", alightingTime: "10:44:00"},
    {orderId: "P_C_003", orderType: "计划正向", agvId: "Slot_013 (大运)", flightSegment: "结束段(提前上车接货)", bindTrain: "T_F_04", boardingStop: "大运", boardingTime: "10:40:00", AlightingStop: "龙城公园", alightingTime: "10:44:00"},
    {orderId: "P_C_008", orderType: "计划正向", agvId: "Slot_010 (大运)", flightSegment: "起始段(送货上车)", bindTrain: "T_F_04", boardingStop: "大运", boardingTime: "10:40:00", AlightingStop: "龙城公园", alightingTime: "10:44:00"},
    {orderId: "P_C_008", orderType: "计划正向", agvId: "Slot_071 (龙城公园)", flightSegment: "结束段(提前上车接货)", bindTrain: "T_F_04", boardingStop: "龙城公园", boardingTime: "10:44:00", AlightingStop: "回龙埔", alightingTime: "10:48:00"},
    {orderId: "P_C_011", orderType: "计划正向", agvId: "Slot_011 (大运)", flightSegment: "起始段(送货上车)", bindTrain: "T_F_04", boardingStop: "大运", boardingTime: "10:40:00", AlightingStop: "龙城公园", alightingTime: "10:44:00"},
    {orderId: "P_C_011", orderType: "计划正向", agvId: "Slot_081 (回龙埔)", flightSegment: "结束段(提前上车接货)", bindTrain: "T_F_04", boardingStop: "回龙埔", boardingTime: "10:48:00", AlightingStop: "坪山围", alightingTime: "10:53:00"},
    {orderId: "P_C_039", orderType: "计划反向", agvId: "Slot_123 (坪山围)", flightSegment: "起始段(送货上车)", bindTrain: "T_B_02", boardingStop: "坪山围", boardingTime: "10:45:00", AlightingStop: "回龙埔", alightingTime: "10:50:00"},
    {orderId: "P_C_039", orderType: "计划反向", agvId: "Slot_055 (龙城公园)", flightSegment: "结束段(提前上车接货)", bindTrain: "T_B_02", boardingStop: "龙城公园", boardingTime: "10:54:00", AlightingStop: "大运", alightingTime: "10:58:00"},
    {orderId: "P_C_048", orderType: "计划反向", agvId: "Slot_153 (燕子湖)", flightSegment: "起始段(送货上车)", bindTrain: "T_B_03", boardingStop: "燕子湖", boardingTime: "10:50:00", AlightingStop: "坪山围", alightingTime: "10:55:00"},
    {orderId: "P_C_048", orderType: "计划反向", agvId: "Slot_045 (龙城公园)", flightSegment: "结束段(提前上车接货)", bindTrain: "T_B_03", boardingStop: "龙城公园", boardingTime: "11:04:00", AlightingStop: "大运", alightingTime: "11:08:00"},
    {orderId: "D_C_082", orderType: "动态正向", agvId: "Slot_145 (燕子湖)", flightSegment: "起始段(送货上车)", bindTrain: "T_F_03", boardingStop: "燕子湖", boardingTime: "10:48:00", AlightingStop: "技术大学", alightingTime: "10:53:00"},
    {orderId: "D_C_082", orderType: "动态正向", agvId: "Slot_146 (燕子湖)", flightSegment: "结束段(提前上车接货)", bindTrain: "T_F_03", boardingStop: "燕子湖", boardingTime: "10:48:00", AlightingStop: "技术大学", alightingTime: "10:53:00"},
    {orderId: "P_C_036", orderType: "计划正向", agvId: "Slot_092 (回龙埔)", flightSegment: "起始段(送货上车)", bindTrain: "T_F_04", boardingStop: "回龙埔", boardingTime: "10:48:00", AlightingStop: "坪山围", alightingTime: "10:53:00"},
    {orderId: "P_C_036", orderType: "计划正向", agvId: "Slot_133 (坪山围)", flightSegment: "结束段(提前上车接货)", bindTrain: "T_F_04", boardingStop: "坪山围", boardingTime: "10:53:00", AlightingStop: "燕子湖", alightingTime: "10:58:00"},
    {orderId: "P_C_040", orderType: "计划反向", agvId: "Slot_122 (坪山围)", flightSegment: "起始段(送货上车)", bindTrain: "T_B_03", boardingStop: "坪山围", boardingTime: "10:55:00", AlightingStop: "回龙埔", alightingTime: "11:00:00"},
    {orderId: "P_C_040", orderType: "计划反向", agvId: "Slot_094 (回龙埔)", flightSegment: "结束段(提前上车接货)", bindTrain: "T_B_03", boardingStop: "回龙埔", boardingTime: "11:00:00", AlightingStop: "龙城公园", alightingTime: "11:04:00"},
    {orderId: "P_C_059", orderType: "计划反向", agvId: "Slot_165 (技术大学)", flightSegment: "起始段(送货上车)", bindTrain: "T_B_04", boardingStop: "技术大学", boardingTime: "10:55:00", AlightingStop: "燕子湖", alightingTime: "11:00:00"},
    {orderId: "P_C_059", orderType: "计划反向", agvId: "Slot_167 (技术大学)", flightSegment: "结束段(提前上车接货)", bindTrain: "T_B_04", boardingStop: "技术大学", boardingTime: "10:55:00", AlightingStop: "燕子湖", alightingTime: "11:00:00"},
    {orderId: "D_C_089", orderType: "动态反向", agvId: "Slot_159 (燕子湖)", flightSegment: "起始段(送货上车)", bindTrain: "T_B_04", boardingStop: "燕子湖", boardingTime: "11:00:00", AlightingStop: "坪山围", alightingTime: "11:05:00"},
    {orderId: "D_C_089", orderType: "动态反向", agvId: "Slot_163 (燕子湖)", flightSegment: "结束段(提前上车接货)", bindTrain: "T_B_04", boardingStop: "燕子湖", boardingTime: "11:00:00", AlightingStop: "坪山围", alightingTime: "11:05:00"},
    {orderId: "D_C_070", orderType: "动态反向", agvId: "Slot_096 (回龙埔)", flightSegment: "起始段(送货上车)", bindTrain: "T_B_03", boardingStop: "回龙埔", boardingTime: "11:00:00", AlightingStop: "龙城公园", alightingTime: "11:04:00"},
    {orderId: "D_C_070", orderType: "动态反向", agvId: "Slot_099 (回龙埔)", flightSegment: "结束段(提前上车接货)", bindTrain: "T_B_03", boardingStop: "回龙埔", boardingTime: "11:00:00", AlightingStop: "龙城公园", alightingTime: "11:04:00"},
    {orderId: "P_C_055", orderType: "计划反向", agvId: "Slot_168 (技术大学)", flightSegment: "起始段(送货上车)", bindTrain: "T_B_04", boardingStop: "技术大学", boardingTime: "10:55:00", AlightingStop: "燕子湖", alightingTime: "11:00:00"},
    {orderId: "P_C_055", orderType: "计划反向", agvId: "Slot_074 (龙城公园)", flightSegment: "结束段(提前上车接货)", bindTrain: "T_B_04", boardingStop: "龙城公园", boardingTime: "11:14:00", AlightingStop: "大运", alightingTime: "11:18:00"},
    {orderId: "D_C_068", orderType: "动态反向", agvId: "Slot_046 (龙城公园)", flightSegment: "起始段(送货上车)", bindTrain: "T_B_02", boardingStop: "龙城公园", boardingTime: "10:54:00", AlightingStop: "大运", alightingTime: "10:58:00"},
    {orderId: "D_C_068", orderType: "动态反向", agvId: "Slot_048 (龙城公园)", flightSegment: "结束段(提前上车接货)", bindTrain: "T_B_02", boardingStop: "龙城公园", boardingTime: "10:54:00", AlightingStop: "大运", alightingTime: "10:58:00"},
    {orderId: "P_C_037", orderType: "计划正向", agvId: "Slot_084 (回龙埔)", flightSegment: "起始段(送货上车)", bindTrain: "T_F_05", boardingStop: "回龙埔", boardingTime: "10:58:00", AlightingStop: "坪山围", alightingTime: "11:03:00"},
    {orderId: "P_C_037", orderType: "计划正向", agvId: "Slot_142 (燕子湖)", flightSegment: "结束段(提前上车接货)", bindTrain: "T_F_05", boardingStop: "燕子湖", boardingTime: "11:08:00", AlightingStop: "技术大学", alightingTime: "11:13:00"},
    {orderId: "D_C_080", orderType: "动态正向", agvId: "Slot_014 (大运)", flightSegment: "起始段(送货上车)", bindTrain: "T_F_06", boardingStop: "大运", boardingTime: "11:00:00", AlightingStop: "龙城公园", alightingTime: "11:04:00"},
    {orderId: "D_C_080", orderType: "动态正向", agvId: "Slot_044 (龙城公园)", flightSegment: "结束段(提前上车接货)", bindTrain: "T_F_06", boardingStop: "龙城公园", boardingTime: "11:04:00", AlightingStop: "回龙埔", alightingTime: "11:08:00"},
    {orderId: "P_C_012", orderType: "计划正向", agvId: "Slot_000 (大运)", flightSegment: "起始段(送货上车)", bindTrain: "T_F_06", boardingStop: "大运", boardingTime: "11:00:00", AlightingStop: "龙城公园", alightingTime: "11:04:00"},
    {orderId: "P_C_012", orderType: "计划正向", agvId: "Slot_127 (坪山围)", flightSegment: "结束段(提前上车接货)", bindTrain: "T_F_06", boardingStop: "坪山围", boardingTime: "11:13:00", AlightingStop: "燕子湖", alightingTime: "11:18:00"},
    {orderId: "D_C_060", orderType: "动态正向", agvId: "Slot_002 (大运)", flightSegment: "起始段(送货上车)", bindTrain: "T_F_07", boardingStop: "大运", boardingTime: "11:10:00", AlightingStop: "龙城公园", alightingTime: "11:14:00"},
    {orderId: "D_C_060", orderType: "动态正向", agvId: "Slot_161 (燕子湖)", flightSegment: "结束段(提前上车接货)", bindTrain: "T_F_07", boardingStop: "燕子湖", boardingTime: "11:28:00", AlightingStop: "技术大学", alightingTime: "11:33:00"},
    {orderId: "D_C_084", orderType: "动态正向", agvId: "Slot_135 (坪山围)", flightSegment: "起始段(送货上车)", bindTrain: "T_F_05", boardingStop: "坪山围", boardingTime: "11:03:00", AlightingStop: "燕子湖", alightingTime: "11:08:00"},
    {orderId: "D_C_084", orderType: "动态正向", agvId: "Slot_150 (燕子湖)", flightSegment: "结束段(提前上车接货)", bindTrain: "T_F_05", boardingStop: "燕子湖", boardingTime: "11:08:00", AlightingStop: "技术大学", alightingTime: "11:13:00"},
    {orderId: "D_C_083", orderType: "动态正向", agvId: "Slot_052 (龙城公园)", flightSegment: "起始段(送货上车)", bindTrain: "T_F_07", boardingStop: "龙城公园", boardingTime: "11:14:00", AlightingStop: "回龙埔", alightingTime: "11:18:00"},
    {orderId: "D_C_083", orderType: "动态正向", agvId: "Slot_154 (燕子湖)", flightSegment: "结束段(提前上车接货)", bindTrain: "T_F_07", boardingStop: "燕子湖", boardingTime: "11:28:00", AlightingStop: "技术大学", alightingTime: "11:33:00"},
    {orderId: "D_C_074", orderType: "动态反向", agvId: "Slot_171 (技术大学)", flightSegment: "起始段(送货上车)", bindTrain: "T_B_06", boardingStop: "技术大学", boardingTime: "11:15:00", AlightingStop: "燕子湖", alightingTime: "11:20:00"},
    {orderId: "D_C_074", orderType: "动态反向", agvId: "Slot_113 (回龙埔)", flightSegment: "结束段(提前上车接货)", bindTrain: "T_B_06", boardingStop: "回龙埔", boardingTime: "11:30:00", AlightingStop: "龙城公园", alightingTime: "11:34:00"},
    {orderId: "D_C_062", orderType: "动态反向", agvId: "Slot_115 (坪山围)", flightSegment: "起始段(送货上车)", bindTrain: "T_B_05", boardingStop: "坪山围", boardingTime: "11:15:00", AlightingStop: "回龙埔", alightingTime: "11:20:00"},
    {orderId: "D_C_062", orderType: "动态反向", agvId: "Slot_038 (龙城公园)", flightSegment: "结束段(提前上车接货)", bindTrain: "T_B_05", boardingStop: "龙城公园", boardingTime: "11:24:00", AlightingStop: "大运", alightingTime: "11:28:00"},
    {orderId: "D_C_086", orderType: "动态正向", agvId: "Slot_039 (龙城公园)", flightSegment: "起始段(送货上车)", bindTrain: "T_F_08", boardingStop: "龙城公园", boardingTime: "11:24:00", AlightingStop: "回龙埔", alightingTime: "11:28:00"},
    {orderId: "D_C_086", orderType: "动态正向", agvId: "Slot_140 (燕子湖)", flightSegment: "结束段(提前上车接货)", bindTrain: "T_F_08", boardingStop: "燕子湖", boardingTime: "11:38:00", AlightingStop: "技术大学", alightingTime: "11:43:00"},
    {orderId: "D_C_073", orderType: "动态反向", agvId: "Slot_170 (技术大学)", flightSegment: "起始段(送货上车)", bindTrain: "T_B_07", boardingStop: "技术大学", boardingTime: "11:25:00", AlightingStop: "燕子湖", alightingTime: "11:30:00"},
    {orderId: "D_C_073", orderType: "动态反向", agvId: "Slot_040 (龙城公园)", flightSegment: "结束段(提前上车接货)", bindTrain: "T_B_07", boardingStop: "龙城公园", boardingTime: "11:44:00", AlightingStop: "大运", alightingTime: "11:48:00"},
    {orderId: "D_C_063", orderType: "动态正向", agvId: "Slot_086 (回龙埔)", flightSegment: "起始段(送货上车)", bindTrain: "T_F_08", boardingStop: "回龙埔", boardingTime: "11:28:00", AlightingStop: "坪山围", alightingTime: "11:33:00"},
    {orderId: "D_C_063", orderType: "动态正向", agvId: "Slot_157 (燕子湖)", flightSegment: "结束段(提前上车接货)", bindTrain: "T_F_08", boardingStop: "燕子湖", boardingTime: "11:38:00", AlightingStop: "技术大学", alightingTime: "11:43:00"},
    {orderId: "D_C_069", orderType: "动态正向", agvId: "Slot_091 (回龙埔)", flightSegment: "起始段(送货上车)", bindTrain: "T_F_08", boardingStop: "回龙埔", boardingTime: "11:28:00", AlightingStop: "坪山围", alightingTime: "11:33:00"},
    {orderId: "D_C_069", orderType: "动态正向", agvId: "Slot_093 (回龙埔)", flightSegment: "结束段(提前上车接货)", bindTrain: "T_F_08", boardingStop: "回龙埔", boardingTime: "11:28:00", AlightingStop: "坪山围", alightingTime: "11:33:00"},
    {orderId: "D_C_071", orderType: "动态反向", agvId: "Slot_082 (回龙埔)", flightSegment: "起始段(送货上车)", bindTrain: "T_B_06", boardingStop: "回龙埔", boardingTime: "11:30:00", AlightingStop: "龙城公园", alightingTime: "11:34:00"},
    {orderId: "D_C_071", orderType: "动态反向", agvId: "Slot_085 (回龙埔)", flightSegment: "结束段(提前上车接货)", bindTrain: "T_B_06", boardingStop: "回龙埔", boardingTime: "11:30:00", AlightingStop: "龙城公园", alightingTime: "11:34:00"},
    {orderId: "D_C_087", orderType: "动态反向", agvId: "Slot_141 (燕子湖)", flightSegment: "起始段(送货上车)", bindTrain: "T_B_08", boardingStop: "燕子湖", boardingTime: "11:40:00", AlightingStop: "坪山围", alightingTime: "11:45:00"},
    {orderId: "D_C_087", orderType: "动态反向", agvId: "Slot_126 (坪山围)", flightSegment: "结束段(提前上车接货)", bindTrain: "T_B_08", boardingStop: "坪山围", boardingTime: "11:45:00", AlightingStop: "回龙埔", alightingTime: "11:50:00"},
    {orderId: "D_C_066", orderType: "动态反向", agvId: "Slot_177 (技术大学)", flightSegment: "起始段(送货上车)", bindTrain: "T_B_09", boardingStop: "技术大学", boardingTime: "11:45:00", AlightingStop: "燕子湖", alightingTime: "11:50:00"},
    {orderId: "D_C_066", orderType: "动态反向", agvId: "Slot_095 (回龙埔)", flightSegment: "结束段(提前上车接货)", bindTrain: "T_B_09", boardingStop: "回龙埔", boardingTime: "12:00:00", AlightingStop: "龙城公园", alightingTime: "12:04:00"},
    {orderId: "D_C_079", orderType: "动态正向", agvId: "Slot_020 (大运)", flightSegment: "起始段(送货上车)", bindTrain: "T_F_11", boardingStop: "大运", boardingTime: "11:50:00", AlightingStop: "龙城公园", alightingTime: "11:54:00"},
    {orderId: "D_C_079", orderType: "动态正向", agvId: "Slot_021 (大运)", flightSegment: "结束段(提前上车接货)", bindTrain: "T_F_11", boardingStop: "大运", boardingTime: "11:50:00", AlightingStop: "龙城公园", alightingTime: "11:54:00"},
    {orderId: "D_C_078", orderType: "动态反向", agvId: "Slot_169 (技术大学)", flightSegment: "起始段(送货上车)", bindTrain: "T_B_10", boardingStop: "技术大学", boardingTime: "11:55:00", AlightingStop: "燕子湖", alightingTime: "12:00:00"},
    {orderId: "D_C_078", orderType: "动态反向", agvId: "Slot_129 (坪山围)", flightSegment: "结束段(提前上车接货)", bindTrain: "T_B_10", boardingStop: "坪山围", boardingTime: "12:05:00", AlightingStop: "回龙埔", alightingTime: "12:10:00"},
    {orderId: "D_C_067", orderType: "动态反向", agvId: "Slot_089 (回龙埔)", flightSegment: "起始段(送货上车)", bindTrain: "T_B_09", boardingStop: "回龙埔", boardingTime: "12:00:00", AlightingStop: "龙城公园", alightingTime: "12:04:00"},
    {orderId: "D_C_067", orderType: "动态反向", agvId: "Slot_051 (龙城公园)", flightSegment: "结束段(提前上车接货)", bindTrain: "T_B_09", boardingStop: "龙城公园", boardingTime: "12:04:00", AlightingStop: "大运", alightingTime: "12:08:00"},
    {orderId: "D_C_061", orderType: "动态反向", agvId: "Slot_158 (燕子湖)", flightSegment: "起始段(送货上车)", bindTrain: "T_B_11", boardingStop: "燕子湖", boardingTime: "12:10:00", AlightingStop: "坪山围", alightingTime: "12:15:00"},
    {orderId: "D_C_061", orderType: "动态反向", agvId: "Slot_041 (龙城公园)", flightSegment: "结束段(提前上车接货)", bindTrain: "T_B_11", boardingStop: "龙城公园", boardingTime: "12:24:00", AlightingStop: "大运", alightingTime: "12:28:00"},
    {orderId: "D_C_072", orderType: "动态正向", agvId: "Slot_107 (回龙埔)", flightSegment: "起始段(送货上车)", bindTrain: "T_F_12", boardingStop: "回龙埔", boardingTime: "12:08:00", AlightingStop: "坪山围", alightingTime: "12:13:00"},
    {orderId: "D_C_072", orderType: "动态正向", agvId: "Slot_162 (燕子湖)", flightSegment: "结束段(提前上车接货)", bindTrain: "T_F_12", boardingStop: "燕子湖", boardingTime: "12:18:00", AlightingStop: "技术大学", alightingTime: "12:23:00"}
]

export const AGV: React.FC = () => {
    // 根据订单类型返回不同的样式类
    const getOrderTypeClass = (type: string) => {
        if (type.includes('计划正向')) return 'text-emerald-400 glow-green';
        if (type.includes('计划反向')) return 'text-blue-400 glow-blue';
        if (type.includes('动态正向')) return 'text-amber-400 glow-yellow';
        if (type.includes('动态反向')) return 'text-rose-400 glow-rose';
        return 'text-cyan-300';
    };

    return (
        <div className="w-full h-full flex flex-col overflow-hidden bg-transparent relative">

            {/* 科技风表头 - 优化设计 */}
            <div className="grid grid-cols-9 text-xs text-cyan-300 border-b border-cyan-500/30 pb-3 mb-3 px-3 uppercase tracking-wider font-semibold relative z-10">
                {/* 表头装饰线 */}
                <div className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent"></div>
                <span className="col-span-1 text-center">订单编号</span>
                <span className="col-span-1 text-center">订单类型</span>
                <span className="col-span-1 text-center">AGV编号</span>
                <span className="col-span-1 text-center">负责航段</span>
                <span className="col-span-1 text-center">绑定列车</span>
                <span className="col-span-1 text-center">上车站点</span>
                <span className="col-span-1 text-center">上车时间</span>
                <span className="col-span-1 text-center">下车站点</span>
                <span className="col-span-1 text-center">下车时间</span>
            </div>

            {/* 滚动内容区域 - 优化科技风设计 */}
            <div className="flex-1 relative overflow-hidden group bg-gray-900/10 rounded-lg border border-cyan-500/10">
                {/* 背景网格效果 */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(6,182,212,0.1)_1px,transparent_1px),linear-gradient(to_bottom,rgba(6,182,212,0.1)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>

                {/* 滚动列表 - 双层容器实现无缝滚动 */}
                <div className="absolute top-0 left-0 w-full animate-marquee hover:pause-animation z-10">
                    {[...rankData, ...rankData].map((item, index) => (
                        <div
                            key={`${item.orderId}-${index}`}
                            className="grid grid-cols-9 items-center text-sm py-2.5 px-3 border-b border-cyan-900/10 hover:bg-cyan-900/20 hover:border-cyan-500/30 transition-all duration-300"
                        >
                            {/* 订单编号 - 增加编号样式 */}
                            <div className="col-span-1 text-gray-200 font-medium truncate text-center" title={item.orderId}>
                                <span className="inline-block w-1 h-1 bg-cyan-400 rounded-full mr-1"></span>
                                {item.orderId}
                            </div>

                            {/* 订单类型 - 彩色标识 */}
                            <div className="col-span-1 truncate text-center" title={item.orderType}>
                                <span className={`inline-block px-1.5 py-0.5 rounded text-xs ${getOrderTypeClass(item.orderType)}`}>
                                    {item.orderType}
                                </span>
                            </div>

                            {/* AGV编号 */}
                            <div className="col-span-1 text-gray-200 truncate text-center" title={item.agvId}>
                                {item.agvId}
                            </div>

                            {/* 负责航段 */}
                            <div className="col-span-1 text-gray-200 truncate text-center" title={item.flightSegment}>
                                {item.flightSegment}
                            </div>

                            {/* 绑定列车 - 特殊样式 */}
                            <div className="col-span-1 text-cyan-300 font-medium truncate text-center glow-blue" title={item.bindTrain}>
                                {item.bindTrain}
                            </div>

                            {/* 上车站点 */}
                            <div className="col-span-1 text-gray-200 truncate text-center" title={item.boardingStop}>
                                {item.boardingStop}
                            </div>

                            {/* 上车时间 */}
                            <div className="col-span-1 text-amber-300 truncate text-center" title={item.boardingTime}>
                                {item.boardingTime}
                            </div>

                            {/* 下车站点 */}
                            <div className="col-span-1 text-gray-200 truncate text-center" title={item.AlightingStop}>
                                {item.AlightingStop}
                            </div>

                            {/* 下车时间 */}
                            <div className="col-span-1 text-amber-300 truncate text-center" title={item.alightingTime}>
                                {item.alightingTime}
                            </div>
                        </div>
                    ))}
                </div>

                {/* 科技风装饰边框和遮罩 */}
                <div className="absolute inset-0 border border-cyan-500/20 rounded-lg pointer-events-none"></div>
                <div className="absolute inset-1 border border-cyan-500/10 rounded-lg pointer-events-none"></div>

                {/* 上下渐变遮罩 - 平滑过渡效果 */}
                <div className="absolute top-0 left-0 w-full h-16 bg-gradient-to-b from-gray-900/80 to-transparent pointer-events-none z-20"></div>
                <div className="absolute bottom-0 left-0 w-full h-16 bg-gradient-to-t from-gray-900/80 to-transparent pointer-events-none z-20"></div>

                {/* 角落装饰 */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t border-l border-cyan-400/40 rounded-tl-lg pointer-events-none"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-t border-r border-cyan-400/40 rounded-tr-lg pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b border-l border-cyan-400/40 rounded-bl-lg pointer-events-none"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b border-r border-cyan-400/40 rounded-br-lg pointer-events-none"></div>
            </div>

            {/* 科技风样式定义 - 优化滚动速度和视觉效果 */}
            <style>{`
                /* 调整滚动速度为60秒（更舒适的速度） */
                @keyframes marquee {
                    0% { transform: translateY(0); }
                    100% { transform: translateY(-50%); }
                }
                .animate-marquee {
                    animation: marquee 120s linear infinite;
                }
                .hover\\:pause-animation:hover {
                    animation-play-state: paused;
                }
                
                /* 增强辉光效果 */
                .glow-green {
                    text-shadow: 0 0 6px rgba(74, 222, 128, 0.7), 0 0 12px rgba(74, 222, 128, 0.3);
                }
                .glow-blue {
                    text-shadow: 0 0 6px rgba(96, 165, 250, 0.7), 0 0 12px rgba(96, 165, 250, 0.3);
                }
                .glow-yellow {
                    text-shadow: 0 0 6px rgba(250, 204, 21, 0.7), 0 0 12px rgba(250, 204, 21, 0.3);
                }
                .glow-rose {
                    text-shadow: 0 0 6px rgba(244, 63, 94, 0.7), 0 0 12px rgba(244, 63, 94, 0.3);
                }
                
                /* 滚动条美化 */
                .group::-webkit-scrollbar {
                    width: 4px;
                    height: 4px;
                }
                .group::-webkit-scrollbar-track {
                    background: rgba(6, 182, 212, 0.1);
                    border-radius: 2px;
                }
                .group::-webkit-scrollbar-thumb {
                    background: rgba(6, 182, 212, 0.5);
                    border-radius: 2px;
                }
                .group::-webkit-scrollbar-thumb:hover {
                    background: rgba(6, 182, 212, 0.7);
                }
                
                /* 整体过渡效果 */
                * {
                    box-sizing: border-box;
                    scrollbar-width: thin;
                    scrollbar-color: rgba(6, 182, 212, 0.5) rgba(6, 182, 212, 0.1);
                }
            `}</style>
        </div>
    );
};
