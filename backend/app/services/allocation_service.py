def calculate_priority(donation, ngo, distance_km):
    score = 0

    # 1️⃣ Expiry urgency (60%)
    if donation.expiry_hours <= 2:
        score += 60
    elif donation.expiry_hours <= 4:
        score += 40
    else:
        score += 20

    # 2️⃣ Distance (30%)
    if distance_km <= 3:
        score += 30
    elif distance_km <= 6:
        score += 20
    else:
        score += 10

    # 3️⃣ NGO performance (10%)
    score += (ngo.performance_score / 100) * 10

    return round(min(score, 100), 1)
