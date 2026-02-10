-- FishOnBid: AI Data Seed Script (100 Auctions)
-- Purpose: Provide historical baseline for RAG-based AI recommendations
-- Locations: Chennai Harbor, Kochi Harbor, Vizag Harbor, Mumbai Harbor, Goa Harbor, Mangalore Harbor
-- Fish Types: Tuna, Salmon, Mackerel, Pomfret, Prawns, Kingfish, Sardines, Rohu, Catla, Hilsa

INSERT INTO auction (fish_name, start_price, current_price, start_time, end_time, active, location, quantity_kg, freshness_score) VALUES
-- TUNA (Chennai Harbor & Vizag Harbor)
('Tuna', 450, 520, '2026-02-01 08:00:00', '2026-02-01 20:00:00', false, 'Chennai Harbor', 120, 85),
('Tuna', 480, 550, '2026-02-02 09:00:00', '2026-02-02 21:00:00', false, 'Chennai Harbor', 150, 90),
('Tuna', 430, 490, '2026-02-03 07:30:00', '2026-02-03 19:30:00', false, 'Chennai Harbor', 100, 80),
('Tuna', 500, 580, '2026-02-04 08:15:00', '2026-02-04 20:15:00', false, 'Vizag Harbor', 200, 88),
('Tuna', 460, 535, '2026-02-05 09:30:00', '2026-02-05 21:30:00', false, 'Vizag Harbor', 180, 82),
('Tuna', 440, 510, '2026-02-06 08:00:00', '2026-02-06 20:00:00', false, 'Chennai Harbor', 110, 86),
('Tuna', 470, 540, '2026-02-07 07:00:00', '2026-02-07 19:00:00', false, 'Chennai Harbor', 130, 84),
('Tuna', 490, 565, '2026-01-30 08:00:00', '2026-01-30 20:00:00', false, 'Vizag Harbor', 160, 92),
('Tuna', 420, 485, '2026-01-31 09:00:00', '2026-01-31 21:00:00', false, 'Vizag Harbor', 90, 78),
('Tuna', 455, 525, '2026-02-01 10:00:00', '2026-02-01 22:00:00', false, 'Chennai Harbor', 140, 87),

-- SALMON (Mumbai Harbor & Kochi Harbor)
('Salmon', 650, 720, '2026-02-01 10:00:00', '2026-02-01 22:00:00', false, 'Mumbai Harbor', 60, 92),
('Salmon', 680, 755, '2026-02-02 11:00:00', '2026-02-02 23:00:00', false, 'Mumbai Harbor', 75, 88),
('Salmon', 620, 695, '2026-02-03 09:30:00', '2026-02-03 21:30:00', false, 'Mumbai Harbor', 50, 85),
('Salmon', 710, 790, '2026-02-04 10:45:00', '2026-02-04 22:45:00', false, 'Kochi Harbor', 90, 94),
('Salmon', 670, 745, '2026-02-05 11:15:00', '2026-02-05 23:15:00', false, 'Kochi Harbor', 85, 90),
('Salmon', 640, 715, '2026-02-06 10:00:00', '2026-02-06 22:00:00', false, 'Mumbai Harbor', 65, 89),
('Salmon', 690, 770, '2026-02-07 09:00:00', '2026-02-07 21:00:00', false, 'Mumbai Harbor', 80, 91),
('Salmon', 700, 785, '2026-01-30 11:00:00', '2026-01-30 23:00:00', false, 'Kochi Harbor', 100, 93),
('Salmon', 630, 705, '2026-01-31 12:00:00', '2026-02-01 00:00:00', false, 'Kochi Harbor', 55, 86),
('Salmon', 660, 735, '2026-02-01 13:00:00', '2026-02-02 01:00:00', false, 'Mumbai Harbor', 70, 87),

-- MACKEREL (Chennai Harbor & Goa Harbor)
('Mackerel', 180, 220, '2026-02-01 06:00:00', '2026-02-01 18:00:00', false, 'Chennai Harbor', 200, 80),
('Mackerel', 190, 235, '2026-02-02 07:00:00', '2026-02-02 19:00:00', false, 'Chennai Harbor', 250, 85),
('Mackerel', 170, 215, '2026-02-03 06:30:00', '2026-02-03 18:30:00', false, 'Chennai Harbor', 180, 78),
('Mackerel', 210, 255, '2026-02-04 07:15:00', '2026-02-04 19:15:00', false, 'Goa Harbor', 300, 88),
('Mackerel', 200, 245, '2026-02-05 08:30:00', '2026-02-05 20:30:00', false, 'Goa Harbor', 220, 82),
('Mackerel', 185, 225, '2026-02-06 06:00:00', '2026-02-06 18:00:00', false, 'Goa Harbor', 210, 81),
('Mackerel', 195, 240, '2026-02-07 05:00:00', '2026-02-07 17:00:00', false, 'Chennai Harbor', 240, 83),
('Mackerel', 205, 250, '2026-01-30 06:00:00', '2026-01-30 18:00:00', false, 'Chennai Harbor', 280, 87),
('Mackerel', 175, 210, '2026-01-31 07:00:00', '2026-01-31 19:00:00', false, 'Goa Harbor', 190, 79),
('Mackerel', 220, 270, '2026-02-01 08:00:00', '2026-02-01 20:00:00', false, 'Goa Harbor', 350, 90),

-- POMFRET (Mumbai Harbor & Mangalore Harbor)
('Pomfret', 550, 630, '2026-02-01 09:00:00', '2026-02-01 19:00:00', false, 'Mumbai Harbor', 40, 90),
('Pomfret', 580, 665, '2026-02-02 10:00:00', '2026-02-02 20:00:00', false, 'Mumbai Harbor', 55, 92),
('Pomfret', 520, 600, '2026-02-03 08:30:00', '2026-02-03 18:30:00', false, 'Mumbai Harbor', 35, 85),
('Pomfret', 600, 690, '2026-02-04 09:15:00', '2026-02-04 19:15:00', false, 'Mangalore Harbor', 70, 94),
('Pomfret', 570, 650, '2026-02-05 10:30:00', '2026-02-05 20:30:00', false, 'Mangalore Harbor', 60, 88),
('Pomfret', 540, 615, '2026-02-06 09:00:00', '2026-02-06 19:00:00', false, 'Mangalore Harbor', 45, 87),
('Pomfret', 590, 680, '2026-02-07 08:00:00', '2026-02-07 18:00:00', false, 'Mumbai Harbor', 65, 93),
('Pomfret', 610, 710, '2026-01-30 09:00:00', '2026-01-30 19:00:00', false, 'Mumbai Harbor', 80, 95),
('Pomfret', 530, 610, '2026-01-31 10:00:00', '2026-01-31 20:00:00', false, 'Mangalore Harbor', 30, 84),
('Pomfret', 560, 645, '2026-02-01 11:00:00', '2026-02-01 21:00:00', false, 'Mangalore Harbor', 50, 89),

-- PRAWNS (Kochi Harbor & Chennai Harbor)
('Prawns', 800, 920, '2026-02-01 11:00:00', '2026-02-01 23:00:00', false, 'Kochi Harbor', 30, 95),
('Prawns', 850, 985, '2026-02-02 12:00:00', '2026-02-03 00:00:00', false, 'Kochi Harbor', 45, 93),
('Prawns', 780, 905, '2026-02-03 10:30:00', '2026-02-03 22:30:00', false, 'Kochi Harbor', 25, 90),
('Prawns', 820, 950, '2026-02-04 11:15:00', '2026-02-04 23:15:00', false, 'Chennai Harbor', 50, 92),
('Prawns', 880, 1020, '2026-02-05 12:30:00', '2026-02-06 00:30:00', false, 'Chennai Harbor', 60, 96),
('Prawns', 790, 915, '2026-02-06 11:00:00', '2026-02-06 23:00:00', false, 'Kochi Harbor', 35, 91),
('Prawns', 860, 995, '2026-02-07 10:00:00', '2026-02-07 22:00:00', false, 'Kochi Harbor', 55, 94),
('Prawns', 840, 970, '2026-01-30 11:00:00', '2026-01-30 23:00:00', false, 'Chennai Harbor', 40, 93),
('Prawns', 770, 890, '2026-01-31 12:00:00', '2026-02-01 00:00:00', false, 'Chennai Harbor', 20, 88),
('Prawns', 830, 960, '2026-02-01 13:00:00', '2026-02-02 01:00:00', false, 'Kochi Harbor', 42, 92),

-- KINGFISH (Vizag Harbor & Goa Harbor)
('Kingfish', 400, 480, '2026-02-01 07:00:00', '2026-02-01 19:00:00', false, 'Vizag Harbor', 80, 88),
('Kingfish', 420, 505, '2026-02-02 08:00:00', '2026-02-02 20:00:00', false, 'Vizag Harbor', 95, 90),
('Kingfish', 390, 470, '2026-02-03 06:30:00', '2026-02-03 18:30:00', false, 'Vizag Harbor', 70, 85),
('Kingfish', 450, 540, '2026-02-04 07:15:00', '2026-02-04 19:15:00', false, 'Goa Harbor', 120, 92),
('Kingfish', 430, 515, '2026-02-05 08:30:00', '2026-02-05 20:30:00', false, 'Goa Harbor', 100, 89),
('Kingfish', 410, 490, '2026-02-06 07:00:00', '2026-02-06 19:00:00', false, 'Vizag Harbor', 85, 87),
('Kingfish', 440, 530, '2026-02-07 06:00:00', '2026-02-07 18:00:00', false, 'Vizag Harbor', 110, 91),
('Kingfish', 460, 560, '2026-01-30 07:00:00', '2026-01-30 19:00:00', false, 'Goa Harbor', 150, 94),
('Kingfish', 380, 455, '2026-01-31 08:00:00', '2026-01-31 20:00:00', false, 'Goa Harbor', 65, 83),
('Kingfish', 425, 510, '2026-02-01 09:00:00', '2026-02-01 21:00:00', false, 'Vizag Harbor', 90, 89),

-- SARDINES (Kochi Harbor & Mangalore Harbor)
('Sardines', 120, 150, '2026-02-01 05:00:00', '2026-02-01 17:00:00', false, 'Kochi Harbor', 500, 75),
('Sardines', 130, 165, '2026-02-02 06:00:00', '2026-02-02 18:00:00', false, 'Kochi Harbor', 600, 80),
('Sardines', 110, 140, '2026-02-03 05:30:00', '2026-02-03 17:30:00', false, 'Kochi Harbor', 450, 72),
('Sardines', 140, 180, '2026-02-04 06:15:00', '2026-02-04 18:15:00', false, 'Mangalore Harbor', 700, 85),
('Sardines', 125, 160, '2026-02-05 07:30:00', '2026-02-05 19:30:00', false, 'Mangalore Harbor', 550, 78),
('Sardines', 115, 145, '2026-02-06 05:00:00', '2026-02-06 17:00:00', false, 'Kochi Harbor', 480, 76),
('Sardines', 135, 175, '2026-02-07 04:00:00', '2026-02-07 16:00:00', false, 'Kochi Harbor', 620, 82),
('Sardines', 145, 190, '2026-01-30 05:00:00', '2026-01-30 17:00:00', false, 'Mangalore Harbor', 800, 88),
('Sardines', 105, 135, '2026-01-31 06:00:00', '2026-01-31 18:00:00', false, 'Mangalore Harbor', 400, 70),
('Sardines', 150, 200, '2026-02-01 07:00:00', '2026-02-01 19:00:00', false, 'Kochi Harbor', 1000, 90),

-- ROHU (Freshwater - Marketed in Mumbai & Chennai)
('Rohu', 200, 250, '2026-02-01 08:00:00', '2026-02-01 20:00:00', false, 'Mumbai Harbor', 300, 85),
('Rohu', 210, 265, '2026-02-02 09:00:00', '2026-02-02 21:00:00', false, 'Mumbai Harbor', 350, 88),
('Rohu', 190, 240, '2026-02-03 07:30:00', '2026-02-03 19:30:00', false, 'Mumbai Harbor', 250, 82),
('Rohu', 220, 280, '2026-02-04 08:15:00', '2026-02-04 20:15:00', false, 'Chennai Harbor', 400, 90),
('Rohu', 205, 255, '2026-02-05 09:30:00', '2026-02-05 21:30:00', false, 'Chennai Harbor', 320, 86),
('Rohu', 195, 245, '2026-02-06 08:00:00', '2026-02-06 20:00:00', false, 'Mumbai Harbor', 280, 84),
('Rohu', 215, 275, '2026-02-07 07:00:00', '2026-02-07 19:00:00', false, 'Mumbai Harbor', 380, 89),
('Rohu', 230, 300, '2026-01-30 08:00:00', '2026-01-30 20:00:00', false, 'Chennai Harbor', 500, 92),
('Rohu', 185, 230, '2026-01-31 09:00:00', '2026-01-31 21:00:00', false, 'Chennai Harbor', 200, 78),
('Rohu', 225, 290, '2026-02-01 10:00:00', '2026-02-01 22:00:00', false, 'Mumbai Harbor', 450, 91),

-- CATLA (Marketed in Vizag & Kochi)
('Catla', 180, 230, '2026-02-01 07:00:00', '2026-02-01 19:00:00', false, 'Vizag Harbor', 250, 84),
('Catla', 190, 245, '2026-02-02 08:00:00', '2026-02-02 20:00:00', false, 'Vizag Harbor', 300, 86),
('Catla', 170, 220, '2026-02-03 06:30:00', '2026-02-03 18:30:00', false, 'Vizag Harbor', 200, 81),
('Catla', 200, 260, '2026-02-04 07:15:00', '2026-02-04 19:15:00', false, 'Kochi Harbor', 350, 88),
('Catla', 195, 250, '2026-02-05 08:30:00', '2026-02-05 20:30:00', false, 'Kochi Harbor', 320, 87),
('Catla', 175, 225, '2026-02-06 07:00:00', '2026-02-06 19:00:00', false, 'Vizag Harbor', 220, 82),
('Catla', 205, 270, '2026-02-07 06:00:00', '2026-02-07 18:00:00', false, 'Vizag Harbor', 400, 90),
('Catla', 210, 280, '2026-01-30 07:00:00', '2026-01-30 19:00:00', false, 'Kochi Harbor', 450, 92),
('Catla', 165, 210, '2026-01-31 08:00:00', '2026-01-31 20:00:00', false, 'Kochi Harbor', 150, 78),
('Catla', 220, 290, '2026-02-01 09:00:00', '2026-02-01 21:00:00', false, 'Vizag Harbor', 500, 93),

-- HILSA (Premium - Marketed in Mumbai & Chennai)
('Hilsa', 1200, 1500, '2026-02-01 10:00:00', '2026-02-01 22:00:00', false, 'Mumbai Harbor', 20, 95),
('Hilsa', 1300, 1650, '2026-02-02 11:00:00', '2026-02-02 23:00:00', false, 'Mumbai Harbor', 25, 96),
('Hilsa', 1100, 1400, '2026-02-03 09:30:00', '2026-02-03 21:30:00', false, 'Mumbai Harbor', 15, 92),
('Hilsa', 1400, 1800, '2026-02-04 10:45:00', '2026-02-04 22:45:00', false, 'Chennai Harbor', 40, 98),
('Hilsa', 1250, 1550, '2026-02-05 11:15:00', '2026-02-05 23:15:00', false, 'Chennai Harbor', 30, 94),
('Hilsa', 1150, 1450, '2026-02-06 10:00:00', '2026-02-06 22:00:00', false, 'Mumbai Harbor', 22, 93),
('Hilsa', 1350, 1750, '2026-02-07 09:00:00', '2026-02-07 21:00:00', false, 'Mumbai Harbor', 35, 97),
('Hilsa', 1500, 2000, '2026-01-30 11:00:00', '2026-01-30 23:00:00', false, 'Chennai Harbor', 50, 99),
('Hilsa', 1050, 1350, '2026-01-31 12:00:00', '2026-02-01 00:00:00', false, 'Chennai Harbor', 10, 88),
('Hilsa', 1450, 1900, '2026-02-01 13:00:00', '2026-02-02 01:00:00', false, 'Mumbai Harbor', 45, 98);
