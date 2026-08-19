using System.Text.RegularExpressions;
using PrakashMart.Application.Interfaces;
using PrakashMart.Domain.Entities;
using PrakashMart.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace PrakashMart.Infrastructure.Persistence;

public static class DbSeeder
{
    public static async Task SeedAsync(AppDbContext db, IPasswordHasher hasher)
    {
        await SeedCategoriesAsync(db);
        await SeedBrandsAsync(db);
        await SeedUsersAsync(db, hasher);
        await SeedProductsAsync(db);
        await BackfillFootwearCategoryAsync(db);
        await BackfillSlugsAsync(db);
        await SeedCouponsAsync(db);
        await SeedBannersAsync(db);
        await SeedVariantTypesAsync(db);
        await SeedProductVariantsAsync(db);
    }

    private static string Slugify(string name)
    {
        var s = name.ToLowerInvariant();
        s = Regex.Replace(s, @"[^a-z0-9\s-]", "");
        s = s.Trim();
        s = Regex.Replace(s, @"\s+", "-");
        s = Regex.Replace(s, @"-+", "-");
        return s;
    }

    private static async Task BackfillSlugsAsync(AppDbContext db)
    {
        var products = await db.Products.Where(p => p.Slug == "").ToListAsync();
        if (products.Count == 0) return;

        var usedSlugs = (await db.Products.Where(p => p.Slug != "").Select(p => p.Slug).ToListAsync()).ToHashSet();
        foreach (var p in products)
        {
            var base_ = Slugify(p.Name);
            var candidate = base_;
            var n = 2;
            while (usedSlugs.Contains(candidate))
                candidate = $"{base_}-{n++}";
            p.SetSlug(candidate);
            usedSlugs.Add(candidate);
        }
        await db.SaveChangesAsync();
    }

    private static async Task BackfillFootwearCategoryAsync(AppDbContext db)
    {
        // Delete old Size-only variants for shoes now in Footwear so they can be
        // re-seeded with Gender + Shoe Size + Color variants by SeedProductVariantsAsync.
        var shoeNames = new[]
        {
            "Nike Air Max 270 Men's Running Shoes",
            "Puma Men's Vikky V3 Sneakers",
            "Adidas Men's Ultraboost 22 Running Shoes",
        };
        var shoeIds = await db.Products
            .Where(p => shoeNames.Contains(p.Name))
            .Select(p => p.Id)
            .ToListAsync();
        if (shoeIds.Count == 0) return;

        var oldVariants = await db.ProductVariants
            .Where(v => shoeIds.Contains(v.ProductId) && v.Attributes.StartsWith("{\"Size\":"))
            .ToListAsync();
        if (oldVariants.Count > 0)
        {
            db.ProductVariants.RemoveRange(oldVariants);
            await db.SaveChangesAsync();
        }
    }

    // ── Categories ────────────────────────────────────────────────────────────

    private static async Task SeedCategoriesAsync(AppDbContext db)
    {
        var names = new[] { "Electronics", "Fashion", "Footwear", "Home & Kitchen", "Books", "Beauty", "Sports", "Toys", "Grocery" };
        var existing = await db.Categories.Select(c => c.Name).ToListAsync();
        var missing = names.Where(n => !existing.Contains(n)).Select(Category.Create).ToList();
        if (missing.Count == 0) return;
        await db.Categories.AddRangeAsync(missing);
        await db.SaveChangesAsync();
    }

    // ── Brands ───────────────────────────────────────────────────────────────

    private static async Task SeedBrandsAsync(AppDbContext db)
    {
        var catMap = await db.Categories.ToDictionaryAsync(c => c.Name, c => c.Id);

        // (brandName, categoryName, description)
        var seeds = new (string Name, string Category, string? Desc)[]
        {
            ("Apple",           "Electronics", "Apple designs the world's most advanced mobile chips and creates products people love — iPhone, Mac, iPad, Apple Watch and more."),
            ("Samsung",         "Electronics", "Samsung is a global leader in consumer electronics, from smartphones and televisions to home appliances and semiconductors."),
            ("boAt",            "Electronics", "boAt is India's leading audio brand offering affordable, feature-rich headphones, earphones, speakers and smartwatches."),
            ("OnePlus",         "Electronics", "OnePlus builds premium smartphones that deliver top-tier performance and a fast, smooth experience at competitive prices."),
            ("Noise",           "Electronics", "Noise is India's #1 smartwatch brand, delivering feature-packed wearables and audio products at accessible price points."),
            ("Redmi",           "Electronics", "Redmi by Xiaomi offers high-quality budget to mid-range smartphones packed with impressive cameras and long-lasting batteries."),
            ("Xiaomi",          "Electronics", "Xiaomi creates innovative, affordable electronics — from smartphones and smart bands to IoT home products."),
            ("HP",              "Electronics", "HP is a global technology company providing laptops, desktops, printers and enterprise solutions for home and business."),
            ("Lenovo",          "Electronics", "Lenovo is a Fortune 500 technology company that makes the world's most innovative PCs and mobile devices."),
            ("Canon",           "Electronics", "Canon has been a leader in imaging solutions for over 80 years — cameras, lenses, printers and professional imaging equipment."),
            ("Sony",            "Electronics", "Sony engineers world-class audio, visual and entertainment products including headphones, cameras, televisions and gaming."),

            ("Nike",            "Footwear", "Nike is the world's largest athletic footwear brand, inspiring athletes worldwide with innovative performance shoes and gear."),
            ("Puma",            "Footwear", "Puma creates high-performance athletic and casual footwear blending sport and fashion for men, women and kids since 1948."),
            ("Adidas",          "Footwear", "Adidas is one of the world's largest sportswear companies, renowned for iconic running shoes and performance footwear."),
            ("Reebok",          "Footwear", "Reebok designs sports and lifestyle footwear built for training, running and everyday wear with comfort-forward technology."),
            ("Skechers",        "Footwear", "Skechers is a global leader in comfort footwear, offering memory foam cushioned shoes for men, women and children."),
            ("Bata",            "Footwear", "Bata is one of the world's largest footwear retailers, trusted across India for affordable, durable everyday shoes since 1894."),
            ("Levi's",          "Fashion",  "Levi's invented blue jeans in 1873 and continues to lead with iconic denim products loved by generations worldwide."),
            ("Allen Solly",     "Fashion",  "Allen Solly is a premium lifestyle brand offering smart casuals and formals for modern professionals across India."),
            ("Peter England",   "Fashion",  "Peter England is one of India's most trusted men's fashion brands, known for quality shirts, trousers and formal wear."),
            ("Fastrack",        "Fashion",  "Fastrack is a youth-centric brand offering trendy watches, sunglasses, helmets and accessories at pocket-friendly prices."),
            ("Wildcraft",       "Fashion",  "Wildcraft is India's leading outdoor gear brand making backpacks, trekking equipment and adventure apparel."),
            ("W",               "Fashion",  "W is a premium women's ethnic wear brand offering contemporary Indian fashion — kurtas, sarees, dresses and fusion wear."),

            ("Prestige",        "Home & Kitchen", "Prestige has been India's most trusted kitchen appliance brand for over 70 years — cookers, mixers, cookware and more."),
            ("Philips",         "Home & Kitchen", "Philips improves people's lives through meaningful innovation in personal health, home appliances and professional lighting."),
            ("Milton",          "Home & Kitchen", "Milton creates quality homeware — flasks, water bottles, lunchboxes and storage products for every Indian household."),
            ("Pigeon",          "Home & Kitchen", "Pigeon offers affordable, durable kitchen appliances and cookware trusted by millions of Indian households."),
            ("Bajaj",           "Home & Kitchen", "Bajaj Electricals is a century-old Indian brand offering reliable home appliances, fans, irons and kitchen products."),
            ("Cello",           "Home & Kitchen", "Cello is a market leader in houseware, stationery and furniture, providing quality plastic and stainless steel products."),
            ("AmazonBasics",    "Home & Kitchen", "AmazonBasics delivers everyday essentials — cleaning supplies, cables, kitchenware and home goods at great value."),
            ("Solimo",          "Home & Kitchen", "Solimo is an Amazon private label brand offering quality home, kitchen and personal care products at value prices."),
            ("Hafele",          "Home & Kitchen", "Hafele is a premium German brand offering high-quality kitchen hardware, appliances and architectural fittings in India."),

            ("Maybelline",      "Beauty", "Maybelline New York brings affordable, trend-forward makeup to beauty lovers worldwide — from foundations to mascaras."),
            ("Lakme",           "Beauty", "Lakmé is India's iconic beauty brand since 1952, offering skincare, makeup and salon services tailored for Indian skin."),
            ("Nivea",           "Beauty", "NIVEA is one of the world's largest skin care brands, trusted for over 110 years with moisturisers, body lotions and deodorants."),
            ("L'Oreal",         "Beauty", "L'Oreal Paris is the world's #1 beauty brand delivering hair care, skincare and makeup for every skin tone and type."),
            ("Biotique",        "Beauty", "Biotique blends ancient Ayurvedic wisdom with modern biotechnology to create 100% botanical, preservative-free beauty products."),

            ("Penguin",         "Books", "Penguin Random House is the world's largest publisher, home to thousands of bestselling authors across every genre."),
            ("Manjul Publishing","Books", "Manjul Publishing brings the world's best non-fiction, self-help and business books to Indian readers in Hindi and English."),
            ("Jaico Publishing","Books", "Jaico is one of India's oldest and most respected publishers, specialising in business, self-help and popular non-fiction."),
            ("Virgin Books",    "Books", "Virgin Books publishes compelling business, entrepreneurship and lifestyle titles for ambitious readers worldwide."),
            ("HarperCollins",   "Books", "HarperCollins is a top-five global English-language publisher with a heritage of over 200 years and thousands of titles."),
            ("Piatkus",         "Books", "Piatkus is a leading UK publisher of self-help, business and personal development books by internationally acclaimed authors."),

            ("Yonex",           "Sports", "Yonex is Japan's leading badminton and tennis equipment manufacturer, trusted by professional athletes across the world."),
            ("Cosco",           "Sports", "Cosco is India's largest sports goods manufacturer, making cricket, football, basketball and fitness equipment since 1980."),
            ("Strauss",         "Sports", "Strauss offers premium fitness and yoga equipment designed for home workouts, helping Indians build an active lifestyle."),

            ("Tata",            "Grocery", "Tata Consumer Products is one of India's largest FMCG companies, offering tea, coffee, salt, pulses and packaged staples."),
            ("Amul",            "Grocery", "Amul is India's largest dairy brand, known for butter, milk, cheese, paneer and ice cream trusted by millions of households."),
            ("Fortune",         "Grocery", "Fortune is India's largest edible oil brand, offering sunflower oil, rice bran oil, mustard oil and ready-to-cook masalas."),
            ("Haldiram's",      "Grocery", "Haldiram's is India's iconic snacks and sweets brand offering namkeens, mithai, ready-to-eat meals and beverages since 1937."),
            ("Maggi",           "Grocery", "Maggi by Nestlé is India's most loved instant noodles brand, along with sauces, cooking aids and seasonings."),

            ("LEGO",            "Toys", "LEGO creates colorful interlocking brick sets that inspire creativity, imagination and problem-solving in children worldwide."),
            ("Funskool",        "Toys", "Funskool is India's leading toy company, offering educational games, action figures and classic board games for all ages."),
            ("Hasbro",          "Toys", "Hasbro is one of the world's largest toy companies, known for Monopoly, Nerf, Play-Doh and Transformers."),
            ("Fisher-Price",    "Toys", "Fisher-Price creates developmental toys and infant gear designed to support learning and growth from birth to age 5."),
            ("Hot Wheels",      "Toys", "Hot Wheels by Mattel is the world's best-selling toy car brand, with die-cast cars and thrilling track sets for kids."),
        };

        var existingBrands = await db.Brands.ToListAsync();
        var existingNames = existingBrands.Select(b => b.Name).ToHashSet();

        // Insert missing brands
        var toAdd = seeds
            .Where(s => !existingNames.Contains(s.Name))
            .Select(s => Brand.Create(s.Name, catMap.TryGetValue(s.Category, out var cId) ? cId : null, s.Desc))
            .ToList();
        if (toAdd.Count > 0)
            await db.Brands.AddRangeAsync(toAdd);

        // Backfill CategoryId and Description on existing brands
        var seedMap = seeds.ToDictionary(s => s.Name, s => s);
        foreach (var brand in existingBrands)
        {
            if (!seedMap.TryGetValue(brand.Name, out var seed)) continue;
            catMap.TryGetValue(seed.Category, out var catId);
            // Always sync category (handles Fashion→Footwear migration)
            var newCatId = catId != Guid.Empty ? catId : brand.CategoryId;
            var needsUpdate = brand.CategoryId != newCatId || (brand.Description == null && seed.Desc != null);
            if (needsUpdate)
                brand.Update(brand.Name, newCatId, seed.Desc ?? brand.Description);
        }

        await db.SaveChangesAsync();
    }

    // ── Users ─────────────────────────────────────────────────────────────────

    private static async Task SeedUsersAsync(AppDbContext db, IPasswordHasher hasher)
    {
        var seeds = new[]
        {
            ("Admin",           "admin@prakashmart.com",      "Admin@1234",    UserRole.Admin),
            ("TechStore India", "techstore@seller.com",    "Seller@1234",   UserRole.Seller),
            ("Fashion Hub",     "fashionhub@seller.com",   "Seller@1234",   UserRole.Seller),
            ("HomeGoods Co.",   "homegoods@seller.com",    "Seller@1234",   UserRole.Seller),
            ("Rahul Sharma",    "rahul@gmail.com",         "Customer@1234", UserRole.Customer),
        };
        var existing = await db.Users.Select(u => u.Email).ToListAsync();
        var missing = seeds
            .Where(s => !existing.Contains(s.Item2))
            .Select(s => User.Create(s.Item1, s.Item2, hasher.Hash(s.Item3), s.Item4))
            .ToList();
        if (missing.Count == 0) return;
        await db.Users.AddRangeAsync(missing);
        await db.SaveChangesAsync();
    }

    // ── Products ──────────────────────────────────────────────────────────────

    private static async Task SeedProductsAsync(AppDbContext db)
    {
        var catMap   = await db.Categories.ToDictionaryAsync(c => c.Name, c => c.Id);
        var brandMap = await db.Brands.ToDictionaryAsync(b => b.Name, b => b.Id);
        var userMap  = await db.Users.ToDictionaryAsync(u => u.Email, u => u.Id);

        var el  = catMap["Electronics"];
        var fa  = catMap["Fashion"];
        var fw  = catMap["Footwear"];
        var hk  = catMap["Home & Kitchen"];
        var bk  = catMap["Books"];
        var be  = catMap["Beauty"];
        var sp  = catMap["Sports"];
        var gr  = catMap["Grocery"];
        var to  = catMap["Toys"];

        var s1 = userMap["techstore@seller.com"];
        var s2 = userMap["fashionhub@seller.com"];
        var s3 = userMap["homegoods@seller.com"];

        // (name, description, price, discount%, categoryId, brand, imageUrl, stock, sellerId)
        var seeds = new (string Name, string Desc, decimal Price, decimal? Disc, Guid Cat, string Brand, string Img, int Stock, Guid Seller)[]
        {
            // ── Electronics ────────────────────────────────────────────────
            ("boAt Rockerz 450 Bluetooth On-Ear Headphones",
             "Premium wireless headphones with 15-hour battery life, 40mm drivers, soft padded earcups, and built-in mic. Compatible with all Bluetooth devices.",
             1299, 67, el, "boAt", "https://images.unsplash.com/photo-1505740420496-3a31e6f1f2ae?w=400&h=400&fit=crop&auto=format", 120, s1),

            ("Samsung Galaxy F15 5G (Groovy Violet, 128GB)",
             "5G smartphone powered by Exynos 1330, 6000mAh battery, 6.5\" FHD+ Super AMOLED display, 50MP triple camera setup, and 25W fast charging.",
             12999, 19, el, "Samsung", "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=400&fit=crop&auto=format", 85, s1),

            ("Apple iPhone 15 (128GB) - Black",
             "iPhone 15 features the powerful A16 Bionic chip, a 48MP main camera with 2x Telephoto, Dynamic Island, USB-C connectivity, and all-day battery life.",
             69999, 12, el, "Apple", "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=400&h=400&fit=crop&auto=format", 40, s1),

            ("OnePlus Nord CE 3 Lite 5G (Pastel Lime, 128GB)",
             "Snapdragon 695 5G, 108MP AI camera, 67W SUPERVOOC fast charging, 5000mAh battery, 6.72\" FHD+ display, 8GB RAM.",
             17999, 10, el, "OnePlus", "https://images.unsplash.com/photo-1574944985070-8f3ebc0f5f80?w=400&h=400&fit=crop&auto=format", 60, s1),

            ("boAt Airdopes 141 True Wireless Earbuds",
             "Up to 42 hours playback, BEAST mode for gaming, IPX4 water resistance, IWP technology, single tap controls, and voice assistant support.",
             999, 75, el, "boAt", "https://images.unsplash.com/photo-1590658268037-41c00b7ede74?w=400&h=400&fit=crop&auto=format", 200, s1),

            ("Noise ColorFit Pro 4 Smartwatch",
             "1.85\" TFT display, Bluetooth calling, 100+ sports modes, SpO2 and heart-rate monitoring, sleep tracking, IP68 water resistance, 7-day battery.",
             2499, 58, el, "Noise", "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop&auto=format", 95, s1),

            ("boAt Stone 352 Bluetooth Speaker",
             "Outdoor wireless speaker with 10W output, IPX5 water resistance, and 10-hour playback.",
             1499, 55, el, "boAt", "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400&h=400&fit=crop&auto=format", 130, s1),

            ("Redmi Note 13 Pro 5G (256GB)",
             "200MP camera, Snapdragon 7s Gen 2, 67W turbo charge, 5100mAh battery, 6.67\" AMOLED display.",
             24999, 17, el, "Redmi", "https://images.unsplash.com/photo-1598327105854-ac9dc99ead58?w=400&h=400&fit=crop&auto=format", 70, s1),

            ("HP 15s Laptop Intel Core i5 (8GB/512GB SSD)",
             "Intel Core i5-1235U, 15.6\" FHD, 512GB SSD, Windows 11, Backlit keyboard, MS Office 2021.",
             52990, 20, el, "HP", "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=400&fit=crop&auto=format", 25, s1),

            ("Canon EOS 1500D DSLR Camera (18-55mm Lens)",
             "24.1MP APS-C CMOS sensor, DIGIC 4+ processor, Full HD video, Wi-Fi + NFC, 9-point AF system.",
             34995, 30, el, "Canon", "https://images.unsplash.com/photo-1452780212412-bc84fc4b3b58?w=400&h=400&fit=crop&auto=format", 18, s1),

            ("Mi Smart Band 8 Active",
             "1.47\" TFT display, 14-day battery, 50m water resistance, 24/7 heart rate monitoring, 19 workout modes.",
             1999, 45, el, "Xiaomi", "https://images.unsplash.com/photo-1551816230-ef5deaed4a29?w=400&h=400&fit=crop&auto=format", 180, s1),

            ("OnePlus Buds 3 True Wireless Earbuds",
             "ANC up to 49dB, 44-hour total playback, 10-minute rapid charge, 3-mic call noise reduction.",
             5299, 47, el, "OnePlus", "https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=400&h=400&fit=crop&auto=format", 90, s1),

            ("Lenovo IdeaPad Slim 3 Ryzen 5 (8GB/512GB)",
             "AMD Ryzen 5 7520U, 15.6\" FHD, 512GB SSD, Windows 11, Rapid Charge, Thin & Light design.",
             42990, 28, el, "Lenovo", "https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=400&h=400&fit=crop&auto=format", 22, s1),

            ("Sony WH-1000XM5 Wireless Headphones",
             "Industry-leading noise cancellation, 30-hour battery, multipoint connection, crystal clear call quality.",
             24990, 38, el, "Sony", "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400&h=400&fit=crop&auto=format", 35, s1),

            // ── Fashion ────────────────────────────────────────────────────
            ("Levi's Men's 511 Slim Fit Jeans",
             "Classic 511 slim fit from Levi's made with stretch denim for all-day comfort. Features 5-pocket styling and sits below waist.",
             1799, 55, fa, "Levi's", "https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&h=400&fit=crop&auto=format", 150, s2),

            ("Nike Air Max 270 Men's Running Shoes",
             "Max Air 270 unit in heel delivers unrivalled, all-day comfort. Foam midsole feels soft underfoot. Engineered mesh upper for breathability.",
             7495, 42, fw, "Nike", "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop&auto=format", 0, s2),

            ("Puma Men's Vikky V3 Sneakers",
             "SoftFoam+ sockliner for superior step-in comfort. Rubber outsole for added traction. Low cut, lace-up closure. Versatile casual design.",
             2499, 50, fw, "Puma", "https://images.unsplash.com/photo-1608231387042-66d1773d3728?w=400&h=400&fit=crop&auto=format", 0, s2),

            ("Allen Solly Men's Slim Fit Formal Shirt",
             "Pure cotton slim fit formal shirt in classic checked pattern. Machine washable, easy care fabric.",
             1299, 60, fa, "Allen Solly", "https://images.unsplash.com/photo-1603252109612-33b15d39caa4?w=400&h=400&fit=crop&auto=format", 120, s2),

            ("Adidas Men's Ultraboost 22 Running Shoes",
             "Responsive BOOST midsole, Primeknit+ upper, Continental rubber outsole for extraordinary grip.",
             13999, 30, fw, "Adidas", "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=400&h=400&fit=crop&auto=format", 0, s2),

            ("W Women's A-Line Kurta",
             "Comfortable A-line kurta in pure cotton with ethnic prints. Available in sizes S to XXL.",
             899, 65, fa, "W", "https://images.unsplash.com/photo-1610030469483-595b9c2e5c65?w=400&h=400&fit=crop&auto=format", 200, s2),

            ("Peter England Men's Slim Chinos",
             "Slim fit chinos in stretch fabric. 5-pocket design. Machine washable. Versatile casual wear.",
             1599, 52, fa, "Peter England", "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=400&h=400&fit=crop&auto=format", 90, s2),

            ("Fastrack Analog Watch for Men",
             "Stainless steel case and bracelet, mineral crystal glass, water resistant to 50m, day-date function.",
             2295, 42, fa, "Fastrack", "https://images.unsplash.com/photo-1524592094714-0f0654e359b1?w=400&h=400&fit=crop&auto=format", 65, s2),

            ("Wildcraft Rucksack Backpack 55L",
             "55L capacity, rain cover included, padded shoulder straps, multiple compartments, ergonomic design.",
             3499, 48, fa, "Wildcraft", "https://images.unsplash.com/photo-1553062408-a9c46b84e83f?w=400&h=400&fit=crop&auto=format", 45, s2),

            // ── Footwear (additional) ──────────────────────────────────────
            ("Nike Women's Air Force 1 Sneakers",
             "Classic Air Force 1 silhouette redesigned for women. Perforated leather upper for breathability. Foam midsole for lightweight, durable cushioning. Rubber outsole with pivot circle for grip and flexibility.",
             6795, 35, fw, "Nike", "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop&auto=format", 0, s2),

            ("Reebok Classic Leather Men's Shoes",
             "Premium leather upper for a clean, timeless look. Die-cut EVA midsole for lightweight cushioning. GumRubber outsole for excellent traction. Low-cut silhouette with cushioned sockliner.",
             3499, 40, fw, "Reebok", "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop&auto=format", 0, s2),

            ("Skechers Women's Go Walk Joy Walking Shoes",
             "5GEN midsole cushioning for lightweight, responsive support. Goga Max insole for high-rebound comfort. Breathable mesh fabric upper. Easy slip-on design with stretch lace detail. Ideal for everyday walking.",
             2499, 38, fw, "Skechers", "https://images.unsplash.com/photo-1608231387042-66d1773d3728?w=400&h=400&fit=crop&auto=format", 0, s2),

            ("Puma Women's Cali Sport Sneakers",
             "Premium leather upper with suede overlays for a luxe, chunky look. Platform rubber midsole for elevated style. SoftFoam+ sockliner for immediate step-in comfort. Lace-up closure for secure fit.",
             3499, 42, fw, "Puma", "https://images.unsplash.com/photo-1608231387042-66d1773d3728?w=400&h=400&fit=crop&auto=format", 0, s2),

            ("Bata North Star Men's Canvas Shoes",
             "Durable canvas upper for breathability. Rubber outsole for grip and long-lasting wear. Lace-up closure for a secure, adjustable fit. Lightweight design for all-day everyday wear.",
             999, 30, fw, "Bata", "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop&auto=format", 0, s2),

            // ── Home & Kitchen ─────────────────────────────────────────────
            ("Prestige Iris 750W Mixer Grinder with 3 Jars",
             "750W powerful motor with 3 stainless steel jars (1.5L, 1L, 0.5L). Liquidising, grinding and chutney jars included. ABS body with SS blade.",
             2499, 50, hk, "Prestige", "https://images.unsplash.com/photo-1556909114-a3c5a1a14c4c?w=400&h=400&fit=crop&auto=format", 70, s3),

            ("Philips HD9200 Air Fryer (4.1L, 1400W)",
             "Rapid Air technology circulates hot air for crispy results using up to 90% less fat. 4.1L capacity, quick clean basket, digital display.",
             6499, 35, hk, "Philips", "https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?w=400&h=400&fit=crop&auto=format", 45, s3),

            ("Milton Thermosteel Flip Lid Flask 1000ml",
             "Keeps beverages hot for up to 24 hours and cold for 48 hours. 304 food-grade stainless steel. Leak-proof, rust-proof, and easy-pour spout.",
             599, 54, hk, "Milton", "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400&h=400&fit=crop&auto=format", 180, s3),

            ("Pigeon Induction Cooktop 1800W",
             "Feather touch controls, 7 preset menu functions, auto shutoff, child lock safety, lightweight design.",
             1499, 55, hk, "Pigeon", "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400&h=400&fit=crop&auto=format", 85, s3),

            ("Bajaj Rex 500W Mixer Grinder",
             "500W motor, 3 jars, stainless steel blades, anti-skid feet, overload protection, 2-year warranty.",
             1399, 50, hk, "Bajaj", "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=400&fit=crop&auto=format", 110, s3),

            ("Amazon Basics Microfiber Cleaning Cloth (12 Pack)",
             "Ultra-soft microfiber, lint-free, machine washable, for car, glass, kitchen surfaces.",
             499, 60, hk, "AmazonBasics", "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop&auto=format", 300, s3),

            ("Cello Plastic Airtight Container Set (6 Pieces)",
             "BPA-free plastic, airtight lid, microwave safe, dishwasher safe, stackable design.",
             599, 55, hk, "Cello", "https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=400&h=400&fit=crop&auto=format", 150, s3),

            ("Solimo 2-Burner LPG Gas Stove",
             "Toughened glass top, brass burners, auto-ignition, spill-proof design, 2-year warranty.",
             2199, 45, hk, "Solimo", "https://images.unsplash.com/photo-1565538810643-b5bdb5f7f8c7?w=400&h=400&fit=crop&auto=format", 55, s3),

            ("Hafele Kitchen Chimney 60cm (1200 m³/hr)",
             "Filterless technology, auto-clean, touch + gesture control, LED lamp, 1200 m³/hr suction.",
             11999, 40, hk, "Hafele", "https://images.unsplash.com/photo-1556909212-d5a69b51c6b6?w=400&h=400&fit=crop&auto=format", 30, s3),

            // ── Books ──────────────────────────────────────────────────────
            ("Atomic Habits by James Clear",
             "The #1 New York Times bestseller. Tiny Changes, Remarkable Results. An Easy & Proven Way to Build Good Habits & Break Bad Ones. Paperback edition.",
             349, 56, bk, "Penguin", "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&h=400&fit=crop&auto=format", 300, s1),

            ("Rich Dad Poor Dad by Robert Kiyosaki",
             "The #1 Personal Finance Book of All Time. What the Rich Teach Their Kids About Money That the Poor and Middle Class Do Not. 25th Anniversary Edition.",
             299, 40, bk, "Manjul Publishing", "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&auto=format", 250, s1),

            ("The Psychology of Money by Morgan Housel",
             "Timeless lessons on wealth, greed, and happiness. One of the best personal finance books ever written.",
             329, 45, bk, "Jaico Publishing", "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=400&fit=crop&auto=format", 350, s1),

            ("Zero to One by Peter Thiel",
             "Notes on Startups, or How to Build the Future. Essential reading for entrepreneurs and innovators.",
             399, 38, bk, "Virgin Books", "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&h=400&fit=crop&auto=format", 200, s1),

            ("The Alchemist by Paulo Coelho",
             "A magical story about following your dreams. One of the best-selling books in history. Paperback.",
             199, 50, bk, "HarperCollins", "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=400&h=400&fit=crop&auto=format", 500, s1),

            ("Deep Work by Cal Newport",
             "Rules for Focused Success in a Distracted World. Learn to work at peak intensity for extended periods.",
             449, 35, bk, "Piatkus", "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400&h=400&fit=crop&auto=format", 180, s1),

            // ── Beauty ─────────────────────────────────────────────────────
            ("Maybelline Fit Me Matte + Poreless Foundation",
             "Oil-free formula for normal to oily skin. Blurs pores and controls shine for a naturally matte look. Available in 40+ shades. 30ml.",
             349, 44, be, "Maybelline", "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=400&h=400&fit=crop&auto=format", 120, s2),

            ("Lakme 9 to 5 Flawless Matte Complexion Compact",
             "Lightweight matte compact that covers blemishes and gives a long-lasting, flawless finish. SPF 18. 8g with puff applicator.",
             249, 38, be, "Lakme", "https://images.unsplash.com/photo-1596462502278-27bfdc403347?w=400&h=400&fit=crop&auto=format", 90, s2),

            ("Nivea Men Dark Spot Reduction Face Wash 100ml",
             "Fights dark spots and pimple marks, contains vitamin C, gentle on skin, suitable for daily use.",
             199, 35, be, "Nivea", "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=400&h=400&fit=crop&auto=format", 250, s2),

            ("L'Oreal Paris 3-in-1 Moisturizer 50ml",
             "Moisturizer, day cream and primer in one. SPF 20 PA+++. For all skin types. Non-greasy formula.",
             499, 40, be, "L'Oreal", "https://images.unsplash.com/photo-1620916566398-39f1143702e2?w=400&h=400&fit=crop&auto=format", 150, s2),

            ("Biotique Bio Honey Gel Face Wash 150ml",
             "Honey and wheat germ, cleanses without stripping, brightening formula, paraben-free, dermatologist tested.",
             149, 52, be, "Biotique", "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=400&h=400&fit=crop&auto=format", 300, s2),

            // ── Sports ─────────────────────────────────────────────────────
            ("Yonex Muscle Power 29 Lite Badminton Racquet",
             "Isometric frame, full graphite construction, beginner to intermediate level, comes with full cover.",
             899, 40, sp, "Yonex", "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=400&h=400&fit=crop&auto=format", 75, s1),

            ("Cosco Dribble Football Size 5",
             "Rubber bladder, machine stitched, all weather use, suitable for training and recreational play.",
             499, 38, sp, "Cosco", "https://images.unsplash.com/photo-1553778263-73a83bab9b0c?w=400&h=400&fit=crop&auto=format", 120, s1),

            ("Strauss Yoga Mat 6mm with Carry Strap",
             "Non-slip surface, eco-friendly TPE material, odor-free, 183cm x 61cm, ideal for home workouts.",
             799, 50, sp, "Strauss", "https://images.unsplash.com/photo-1575052814086-f385e2e2ad1b?w=400&h=400&fit=crop&auto=format", 200, s1),

            // ── Grocery ────────────────────────────────────────────────────
            ("Tata Tea Gold",
             "Rich, full-bodied flavour with the goodness of long and short leaf tea. India's favourite premium tea brand. Best enjoyed with milk.",
             249, 12, gr, "Tata", "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=400&fit=crop&auto=format", 0, s3),

            ("Fortune Sunflower Oil",
             "Light, healthy, refined sunflower oil with high Vitamin E content. Ideal for everyday cooking — frying, tempering and baking. FSSAI approved.",
             149, 8, gr, "Fortune", "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&h=400&fit=crop&auto=format", 0, s3),

            ("Amul Butter",
             "India's favourite butter — made from fresh cream, pasteurised, salted and packed for freshness. Perfect for spreading, cooking and baking.",
             57, 5, gr, "Amul", "https://images.unsplash.com/photo-1589985270958-bf087b219944?w=400&h=400&fit=crop&auto=format", 0, s3),

            ("Haldiram's Aloo Bhujia Namkeen",
             "India's most loved crispy potato snack with a perfect blend of spices. No added preservatives, made with quality potatoes and fresh masalas.",
             90, 18, gr, "Haldiram's", "https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=400&h=400&fit=crop&auto=format", 0, s3),

            ("Maggi 2-Minute Noodles (12 Pack)",
             "India's favourite instant noodles — cooked in just 2 minutes. Classic Masala flavour loved by generations. 12 packs of 70g each in one box.",
             199, 10, gr, "Maggi", "https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=400&h=400&fit=crop&auto=format", 0, s3),

            // ── Toys ───────────────────────────────────────────────────────
            ("LEGO Classic Creative Brick Box",
             "Open-ended creative play with 484 pieces in 33 classic LEGO colours. Build anything you can imagine — houses, cars, animals and more. Ages 4+.",
             2999, 25, to, "LEGO", "https://images.unsplash.com/photo-1585366119957-e9730b6d0f60?w=400&h=400&fit=crop&auto=format", 0, s1),

            ("Funskool Candy Land Board Game",
             "The classic sweet adventure board game for young children. No reading required — just follow the colours to reach Candy Castle. 2-4 players.",
             599, 30, to, "Funskool", "https://images.unsplash.com/photo-1611996575749-79a3a250f948?w=400&h=400&fit=crop&auto=format", 0, s1),

            ("Hasbro Monopoly Classic Edition",
             "The world's most famous property trading board game. Buy, sell and trade your way to becoming the wealthiest player. 2-8 players, ages 8+.",
             1299, 35, to, "Hasbro", "https://images.unsplash.com/photo-1611996575749-79a3a250f948?w=400&h=400&fit=crop&auto=format", 0, s1),

            ("Fisher-Price Laugh & Learn Baby Gym",
             "5-in-1 interactive gym with lights, music and motion detection. 75+ songs, tunes and phrases. Grows with baby from kick-and-play to tummy time.",
             1999, 20, to, "Fisher-Price", "https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=400&h=400&fit=crop&auto=format", 0, s1),

            ("Hot Wheels 20-Car Gift Pack",
             "Set of 20 die-cast Hot Wheels cars in assorted styles and colours. Perfect for collecting, gifting and racing. 1:64 scale. Ages 3+.",
             799, 40, to, "Hot Wheels", "https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=400&h=400&fit=crop&auto=format", 0, s1),
        };

        // Extra product details: (name, warranty, countryOfOrigin, dispatchInfo, shipsFrom, offers, imageUrls)
        var details = new Dictionary<string, (string? Warranty, string? Origin, string? Dispatch, string? ShipsFrom, List<string> Offers, List<string> ImageUrls)>
        {
            // ── Electronics ────────────────────────────────────────────────
            ["boAt Rockerz 450 Bluetooth On-Ear Headphones"] = ("1 year manufacturer warranty", "India", "Same day dispatch for orders placed before 4 PM", "Bengaluru", ["No Cost EMI from ₹108/month"], [
                "https://images.unsplash.com/photo-1505740420496-3a31e6f1f2ae?w=400&h=400&fit=crop",
                "https://images.unsplash.com/photo-1613040809024-b4ef7ba99bc3?w=400&h=400&fit=crop",
                "https://images.unsplash.com/photo-1590658268037-41c00b7ede74?w=400&h=400&fit=crop",
            ]),
            ["Samsung Galaxy F15 5G (Groovy Violet, 128GB)"] = ("1 year manufacturer warranty", "South Korea", "Dispatched in 1-2 business days", "Bengaluru", ["No Cost EMI from ₹1,083/month", "10% off on Samsung Pay"], [
                "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=400&fit=crop",
                "https://images.unsplash.com/photo-1574944985070-8f3ebc0f5f80?w=400&h=400&fit=crop",
                "https://images.unsplash.com/photo-1598327105854-ac9dc99ead58?w=400&h=400&fit=crop",
            ]),
            ["Apple iPhone 15 (128GB) - Black"] = ("1 year Apple India warranty", "China", "Dispatched in 1-2 business days", "Bengaluru", ["No Cost EMI from ₹5,833/month", "Exchange up to ₹25,000 off"], [
                "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=400&h=400&fit=crop",
                "https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400&h=400&fit=crop",
                "https://images.unsplash.com/photo-1591337676887-a217a6970a8a?w=400&h=400&fit=crop",
            ]),
            ["OnePlus Nord CE 3 Lite 5G (Pastel Lime, 128GB)"] = ("1 year manufacturer warranty", "China", "Same day dispatch for orders placed before 4 PM", "Bengaluru", ["No Cost EMI from ₹1,500/month", "Exchange up to ₹15,000 off"], [
                "https://images.unsplash.com/photo-1574944985070-8f3ebc0f5f80?w=400&h=400&fit=crop",
                "https://images.unsplash.com/photo-1598327105854-ac9dc99ead58?w=400&h=400&fit=crop",
                "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=400&fit=crop",
            ]),
            ["boAt Airdopes 141 True Wireless Earbuds"] = ("1 year manufacturer warranty", "India", "Same day dispatch for orders placed before 4 PM", "Bengaluru", ["No Cost EMI from ₹84/month"], [
                "https://images.unsplash.com/photo-1590658268037-41c00b7ede74?w=400&h=400&fit=crop",
                "https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=400&h=400&fit=crop",
            ]),
            ["Noise ColorFit Pro 4 Smartwatch"] = ("1 year manufacturer warranty", "India", "Same day dispatch for orders placed before 4 PM", "Bengaluru", ["No Cost EMI from ₹208/month"], [
                "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop",
                "https://images.unsplash.com/photo-1551816230-ef5deaed4a29?w=400&h=400&fit=crop",
            ]),
            ["HP 15s Laptop Intel Core i5 (8GB/512GB SSD)"] = ("1 year onsite warranty", "China", "Dispatched in 1-2 business days", "Bengaluru", ["No Cost EMI from ₹4,416/month", "Exchange up to ₹20,000 off"], [
                "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=400&fit=crop",
                "https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=400&h=400&fit=crop",
                "https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=400&h=400&fit=crop",
            ]),
            ["Lenovo IdeaPad Slim 3 Ryzen 5 (8GB/512GB)"] = ("1 year onsite warranty", "China", "Dispatched in 1-2 business days", "Bengaluru", ["No Cost EMI from ₹3,583/month", "Exchange up to ₹18,000 off"], [
                "https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=400&h=400&fit=crop",
                "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=400&fit=crop",
                "https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=400&h=400&fit=crop",
            ]),
            ["Sony WH-1000XM5 Wireless Headphones"] = ("1 year manufacturer warranty", "Malaysia", "Dispatched in 1-2 business days", "Bengaluru", ["No Cost EMI from ₹2,083/month"], [
                "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400&h=400&fit=crop",
                "https://images.unsplash.com/photo-1505740420496-3a31e6f1f2ae?w=400&h=400&fit=crop",
                "https://images.unsplash.com/photo-1613040809024-b4ef7ba99bc3?w=400&h=400&fit=crop",
            ]),
            ["Canon EOS 1500D DSLR Camera (18-55mm Lens)"] = ("1 year manufacturer warranty", "Japan", "Dispatched in 1-2 business days", "Bengaluru", ["No Cost EMI from ₹2,916/month", "Exchange up to ₹8,000 off"], [
                "https://images.unsplash.com/photo-1452780212412-bc84fc4b3b58?w=400&h=400&fit=crop",
                "https://images.unsplash.com/photo-1519638831568-d9897f54ed69?w=400&h=400&fit=crop",
            ]),

            // ── Fashion ────────────────────────────────────────────────────
            ["Levi's Men's 511 Slim Fit Jeans"] = (null, "Bangladesh", "Same day dispatch for orders placed before 4 PM", "Mumbai", [], [
                "https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&h=400&fit=crop",
                "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=400&h=400&fit=crop",
            ]),
            ["Nike Air Max 270 Men's Running Shoes"] = (null, "Vietnam", "Same day dispatch for orders placed before 4 PM", "Mumbai", [], [
                "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop",
                "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=400&h=400&fit=crop",
            ]),
            ["Puma Men's Vikky V3 Sneakers"] = (null, "India", "Same day dispatch for orders placed before 4 PM", "Mumbai", [], [
                "https://images.unsplash.com/photo-1608231387042-66d1773d3728?w=400&h=400&fit=crop",
                "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop",
            ]),
            ["Adidas Men's Ultraboost 22 Running Shoes"] = (null, "Vietnam", "Same day dispatch for orders placed before 4 PM", "Mumbai", ["No Cost EMI from ₹1,167/month"], [
                "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=400&h=400&fit=crop",
                "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop",
            ]),

            // ── Home & Kitchen ─────────────────────────────────────────────
            ["Prestige Iris 750W Mixer Grinder with 3 Jars"] = ("2 year manufacturer warranty", "India", "Dispatched in 1-2 business days", "Delhi NCR", [], [
                "https://images.unsplash.com/photo-1556909114-a3c5a1a14c4c?w=400&h=400&fit=crop",
                "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=400&fit=crop",
            ]),
            ["Philips HD9200 Air Fryer (4.1L, 1400W)"] = ("2 year manufacturer warranty", "China", "Dispatched in 1-2 business days", "Delhi NCR", ["No Cost EMI from ₹542/month"], [
                "https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?w=400&h=400&fit=crop",
                "https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400&h=400&fit=crop",
            ]),
            ["Hafele Kitchen Chimney 60cm (1200 m³/hr)"] = ("2 year manufacturer warranty", "Germany", "Dispatched in 2-3 business days", "Delhi NCR", ["No Cost EMI from ₹1,000/month"], [
                "https://images.unsplash.com/photo-1556909212-d5a69b51c6b6?w=400&h=400&fit=crop",
                "https://images.unsplash.com/photo-1556909114-a3c5a1a14c4c?w=400&h=400&fit=crop",
            ]),

            // ── Books ──────────────────────────────────────────────────────
            ["Atomic Habits by James Clear"] = (null, "India", "Same day dispatch for orders placed before 4 PM", "Bengaluru", [], [
                "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&h=400&fit=crop",
                "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=400&fit=crop",
            ]),

            // ── Beauty ─────────────────────────────────────────────────────
            ["Maybelline Fit Me Matte + Poreless Foundation"] = (null, "USA", "Same day dispatch for orders placed before 4 PM", "Mumbai", [], [
                "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=400&h=400&fit=crop",
                "https://images.unsplash.com/photo-1596462502278-27bfdc403347?w=400&h=400&fit=crop",
            ]),
        };

        var existingProducts = await db.Products.ToDictionaryAsync(p => p.Name);

        var toAdd = new List<Product>();
        foreach (var s in seeds)
        {
            details.TryGetValue(s.Name, out var d);
            if (existingProducts.TryGetValue(s.Name, out var existing))
            {
                // Update image URL if it still uses the old placeholder
                if (existing.ImageUrl.Contains("picsum.photos"))
                    existing.Update(s.Name, s.Desc, s.Price, s.Disc, s.Cat, brandMap[s.Brand], s.Img, s.Stock,
                        d.ImageUrls, d.Warranty, d.Origin, d.Dispatch, d.ShipsFrom, d.Offers);
                // Backfill category migration (e.g. shoes moved from Fashion → Footwear)
                else if (existing.CategoryId != s.Cat)
                    existing.Update(s.Name, s.Desc, s.Price, s.Disc, s.Cat, brandMap[s.Brand], s.Img, s.Stock,
                        d.ImageUrls?.Count > 0 ? d.ImageUrls : (existing.ImageUrls.Count > 0 ? existing.ImageUrls : null),
                        d.Warranty ?? existing.Warranty, d.Origin ?? existing.CountryOfOrigin,
                        d.Dispatch ?? existing.DispatchInfo, d.ShipsFrom ?? existing.ShipsFrom,
                        d.Offers?.Count > 0 ? d.Offers : (existing.Offers.Count > 0 ? existing.Offers : null));
                // Backfill new detail fields on existing products
                else if (existing.Warranty == null && d.Warranty != null)
                    existing.Update(s.Name, s.Desc, s.Price, s.Disc, s.Cat, brandMap[s.Brand], s.Img, s.Stock,
                        d.ImageUrls?.Count > 0 ? d.ImageUrls : existing.ImageUrls,
                        d.Warranty, d.Origin, d.Dispatch, d.ShipsFrom,
                        d.Offers?.Count > 0 ? d.Offers : existing.Offers);
            }
            else
            {
                toAdd.Add(Product.Create(s.Name, s.Desc, s.Price, s.Disc, s.Cat, brandMap[s.Brand], s.Img, s.Stock, s.Seller,
                    d.ImageUrls, d.Warranty, d.Origin, d.Dispatch, d.ShipsFrom, d.Offers));
            }
        }

        if (toAdd.Count > 0) await db.Products.AddRangeAsync(toAdd);
        await db.SaveChangesAsync();
    }

    // ── Coupons ───────────────────────────────────────────────────────────────

    private static async Task SeedCouponsAsync(AppDbContext db)
    {
        var seeds = new (string Code, decimal Pct, int MaxUses, DateTime Expiry)[]
        {
            ("WELCOME10", 10, 100, DateTime.UtcNow.AddYears(1)),
            ("SAVE20",    20,  50, DateTime.UtcNow.AddMonths(6)),
            ("FLAT5",      5, 200, DateTime.UtcNow.AddYears(2)),
        };
        var existing = await db.Coupons.Select(c => c.Code).ToListAsync();
        var missing = seeds
            .Where(s => !existing.Contains(s.Code))
            .Select(s => Coupon.Create(s.Code, s.Pct, s.MaxUses, s.Expiry))
            .ToList();
        if (missing.Count == 0) return;
        await db.Coupons.AddRangeAsync(missing);
        await db.SaveChangesAsync();
    }

    // ── Banners ───────────────────────────────────────────────────────────────

    private static async Task SeedBannersAsync(AppDbContext db)
    {
        if (await db.Banners.AnyAsync()) return;

        var seeds = new (string Title, string Subtitle, string Badge, string Cta, string Cat, string Gradient, string Emoji, int Sort)[]
        {
            ("Up to 80% Off",       "Electronics Mega Sale — Phones, Laptops & More",               "🔥 Limited Time",  "Shop Electronics", "Electronics",   "from-blue-700 via-blue-500 to-cyan-400",     "📱", 1),
            ("Fashion Fiesta",      "Min 50% off on top brands — Levi's, Nike, Puma & more",        "✨ New Arrivals",   "Explore Fashion",  "Fashion",       "from-pink-600 via-rose-500 to-orange-400",   "👗", 2),
            ("Home Makeover Sale",  "Kitchen essentials, decor & appliances starting ₹299",         "🏠 Best Sellers",  "Shop Home",        "Home & Kitchen","from-emerald-600 via-green-500 to-teal-400", "🛋️", 3),
            ("Beauty & Wellness",   "Top skincare, makeup & grooming brands at unbeatable prices",  "💎 Premium Picks", "Shop Beauty",      "Beauty",        "from-purple-600 via-violet-500 to-pink-400", "💄", 4),
        };

        var banners = seeds.Select(s => Banner.Create(s.Title, s.Subtitle, s.Badge, s.Cta, s.Cat, s.Gradient, s.Emoji, s.Sort)).ToList();
        await db.Banners.AddRangeAsync(banners);
        await db.SaveChangesAsync();
    }

    // ── Variant Types ─────────────────────────────────────────────────────────

    private static async Task SeedVariantTypesAsync(AppDbContext db)
    {
        var catMap = await db.Categories.ToDictionaryAsync(c => c.Name, c => c.Id);
        var existingTypes = await db.VariantTypes.ToDictionaryAsync(v => v.Name);
        var existingMappings = (await db.CategoryVariantTypes
            .Select(m => new { m.CategoryId, m.VariantTypeId })
            .ToListAsync())
            .Select(m => (m.CategoryId, m.VariantTypeId))
            .ToHashSet();

        string Opts(string[] opts) => System.Text.Json.JsonSerializer.Serialize(opts);

        var typeSeeds = new (string Name, string InputType, string Options, string[] Cats)[]
        {
            ("Size",      "select", Opts(["XS","S","M","L","XL","XXL"]),                                              ["Fashion","Sports","Home & Kitchen"]),
            ("Color",     "text",   Opts([]),                                                                           ["Fashion","Electronics","Sports","Beauty","Toys","Home & Kitchen","Footwear"]),
            ("Storage",   "select", Opts(["64GB","128GB","256GB","512GB","1TB"]),                                     ["Electronics"]),
            ("RAM",       "select", Opts(["4GB","6GB","8GB","12GB","16GB","32GB"]),                                   ["Electronics"]),
            ("Shade",     "text",   Opts([]),                                                                           ["Beauty"]),
            ("Volume",    "select", Opts(["30ml","50ml","100ml","200ml","500ml"]),                                    ["Beauty"]),
            ("Weight",    "select", Opts(["100g","250g","500g","1kg","2kg","5kg"]),                                   ["Grocery"]),
            ("Format",    "select", Opts(["Hardcover","Paperback","eBook"]),                                          ["Books"]),
            ("Age Group", "select", Opts(["0-2 yrs","3-5 yrs","6-8 yrs","9-12 yrs","12+ yrs"]),                     ["Toys"]),
            ("Gender",    "select", Opts(["Men","Women","Unisex"]),                                                    ["Footwear"]),
            ("Shoe Size", "select", Opts(["UK 3","UK 4","UK 5","UK 6","UK 7","UK 8","UK 9","UK 10","UK 11","UK 12"]),["Footwear"]),
        };

        var newMappings = new List<CategoryVariantType>();
        foreach (var seed in typeSeeds)
        {
            if (!existingTypes.TryGetValue(seed.Name, out var vt))
            {
                vt = VariantType.Create(seed.Name, seed.InputType, seed.Options);
                await db.VariantTypes.AddAsync(vt);
                await db.SaveChangesAsync();
            }
            for (var i = 0; i < seed.Cats.Length; i++)
            {
                if (!catMap.TryGetValue(seed.Cats[i], out var catId)) continue;
                if (existingMappings.Contains((catId, vt.Id))) continue;
                newMappings.Add(CategoryVariantType.Create(catId, vt.Id, i, false));
            }
        }
        if (newMappings.Count > 0)
        {
            await db.CategoryVariantTypes.AddRangeAsync(newMappings);
            await db.SaveChangesAsync();
        }
    }

    // ── Product Variants ──────────────────────────────────────────────────────

    private static async Task SeedProductVariantsAsync(AppDbContext db)
    {
        // Products that already have proper (non-empty) variants — skip them
        var seeded = (await db.ProductVariants
            .Where(v => v.Attributes != "{}")
            .Select(v => v.ProductId)
            .ToListAsync()).ToHashSet();

        // Remove stale empty-attribute variants for products not yet seeded
        var stale = await db.ProductVariants
            .Where(v => v.Attributes == "{}" && !seeded.Contains(v.ProductId))
            .ToListAsync();
        if (stale.Count > 0) { db.ProductVariants.RemoveRange(stale); await db.SaveChangesAsync(); }

        var products = await db.Products.ToDictionaryAsync(p => p.Name);
        var variants = new List<ProductVariant>();

        string Attrs(object obj) => System.Text.Json.JsonSerializer.Serialize(obj);
        string AttrsDict(Dictionary<string, string> d) => System.Text.Json.JsonSerializer.Serialize(d);

        void AddSizes(string name, string[] sizes, int stockEach)
        {
            if (!products.TryGetValue(name, out var p) || seeded.Contains(p.Id)) return;
            foreach (var s in sizes)
                variants.Add(ProductVariant.Create(p.Id, Attrs(new { Size = s }), stockEach, null));
        }

        void AddColors(string name, string[] colors, int stockEach)
        {
            if (!products.TryGetValue(name, out var p) || seeded.Contains(p.Id)) return;
            foreach (var c in colors)
                variants.Add(ProductVariant.Create(p.Id, Attrs(new { Color = c }), stockEach, null));
        }

        void AddSizesAndColors(string name, string[] sizes, string[] colors, int stockEach)
        {
            if (!products.TryGetValue(name, out var p) || seeded.Contains(p.Id)) return;
            foreach (var s in sizes)
                foreach (var c in colors)
                    variants.Add(ProductVariant.Create(p.Id, Attrs(new { Size = s, Color = c }), stockEach, null));
        }

        void AddStorageAndColor(string name, (string Storage, string Color, int Stock, decimal? Price)[] items)
        {
            if (!products.TryGetValue(name, out var p) || seeded.Contains(p.Id)) return;
            foreach (var item in items)
                variants.Add(ProductVariant.Create(p.Id, Attrs(new { Storage = item.Storage, Color = item.Color }), item.Stock, item.Price));
        }

        void AddShades(string name, string[] shades, int stockEach)
        {
            if (!products.TryGetValue(name, out var p) || seeded.Contains(p.Id)) return;
            foreach (var s in shades)
                variants.Add(ProductVariant.Create(p.Id, Attrs(new { Shade = s }), stockEach, null));
        }

        void AddVolumes(string name, (string Volume, int Stock, decimal? Price)[] items)
        {
            if (!products.TryGetValue(name, out var p) || seeded.Contains(p.Id)) return;
            foreach (var item in items)
                variants.Add(ProductVariant.Create(p.Id, Attrs(new { Volume = item.Volume }), item.Stock, item.Price));
        }

        void AddFormats(string name, (string Format, int Stock, decimal? Price)[] items)
        {
            if (!products.TryGetValue(name, out var p) || seeded.Contains(p.Id)) return;
            foreach (var item in items)
                variants.Add(ProductVariant.Create(p.Id, Attrs(new { Format = item.Format }), item.Stock, item.Price));
        }

        void AddWeights(string name, (string Weight, int Stock, decimal? Price)[] items)
        {
            if (!products.TryGetValue(name, out var p) || seeded.Contains(p.Id)) return;
            foreach (var item in items)
                variants.Add(ProductVariant.Create(p.Id, Attrs(new { Weight = item.Weight }), item.Stock, item.Price));
        }

        void AddAgeGroups(string name, string[] ageGroups, int stockEach)
        {
            if (!products.TryGetValue(name, out var p) || seeded.Contains(p.Id)) return;
            foreach (var ag in ageGroups)
                variants.Add(ProductVariant.Create(p.Id,
                    AttrsDict(new Dictionary<string, string> { ["Age Group"] = ag }), stockEach, null));
        }

        void AddFootwear(string name, string[] genders, string[] shoeSizes, string[] colors, int stockEach)
        {
            if (!products.TryGetValue(name, out var p) || seeded.Contains(p.Id)) return;
            foreach (var g in genders)
                foreach (var s in shoeSizes)
                    foreach (var c in colors)
                        variants.Add(ProductVariant.Create(p.Id,
                            AttrsDict(new Dictionary<string, string> { ["Gender"] = g, ["Shoe Size"] = s, ["Color"] = c }),
                            stockEach, null));
        }

        // ── Fashion — sizes only ──────────────────────────────────────────────
        AddSizes("Levi's Men's 511 Slim Fit Jeans",
            ["28", "30", "32", "34", "36"], 30);
        AddSizes("Allen Solly Men's Slim Fit Formal Shirt",
            ["S", "M", "L", "XL", "XXL"], 25);

        // ── Fashion — sizes + colors ──────────────────────────────────────────
        AddSizesAndColors("Peter England Men's Slim Chinos",
            ["28", "30", "32", "34"], ["Navy", "Beige", "Olive"], 15);
        AddSizesAndColors("W Women's A-Line Kurta",
            ["S", "M", "L", "XL", "XXL"], ["Blue", "Red", "Green", "Yellow"], 20);

        // ── Fashion — colors only ─────────────────────────────────────────────
        AddColors("Fastrack Analog Watch for Men", ["Black Dial", "Blue Dial", "Silver Dial"], 22);
        AddColors("Wildcraft Rucksack Backpack 55L", ["Black", "Olive Green", "Navy Blue", "Rust Red"], 11);

        // ── Electronics — color variants ──────────────────────────────────────
        AddColors("boAt Rockerz 450 Bluetooth On-Ear Headphones",
            ["Active Black", "Teal", "Blue", "Red"], 30);
        AddColors("boAt Airdopes 141 True Wireless Earbuds",
            ["Active Black", "White", "Blue", "Red"], 50);
        AddColors("Noise ColorFit Pro 4 Smartwatch",
            ["Jet Black", "Deep Blue", "Rose Gold", "Olive Green"], 25);
        AddColors("boAt Stone 352 Bluetooth Speaker", ["Black", "Blue", "Red"], 35);
        AddColors("Mi Smart Band 8 Active",
            ["Midnight Black", "Ivory White", "Coral Orange", "Lavender Blue"], 45);
        AddColors("OnePlus Buds 3 True Wireless Earbuds", ["Midnight Black", "Soft White"], 30);
        AddColors("Sony WH-1000XM5 Wireless Headphones", ["Black", "Silver"], 12);
        AddColors("Samsung Galaxy F15 5G (Groovy Violet, 128GB)",
            ["Groovy Violet", "Sunny Saffron", "Monster Green"], 28);
        AddColors("HP 15s Laptop Intel Core i5 (8GB/512GB SSD)", ["Natural Silver", "Jet Black"], 12);
        AddColors("Lenovo IdeaPad Slim 3 Ryzen 5 (8GB/512GB)", ["Arctic Grey", "Abyss Blue"], 11);
        AddColors("Canon EOS 1500D DSLR Camera (18-55mm Lens)", ["Black"], 18);

        // ── Electronics — storage + color variants ────────────────────────────
        AddStorageAndColor("Apple iPhone 15 (128GB) - Black", [
            ("128GB", "Black",  15, null),
            ("128GB", "Blue",   12, null),
            ("128GB", "Pink",   10, null),
            ("256GB", "Black",  10, 79999m),
            ("256GB", "Blue",    8, 79999m),
            ("512GB", "Black",   5, 99999m),
        ]);
        AddStorageAndColor("OnePlus Nord CE 3 Lite 5G (Pastel Lime, 128GB)", [
            ("128GB", "Pastel Lime",    25, null),
            ("128GB", "Chromatic Gray", 20, null),
            ("256GB", "Pastel Lime",    15, 19999m),
            ("256GB", "Chromatic Gray", 12, 19999m),
        ]);
        AddStorageAndColor("Redmi Note 13 Pro 5G (256GB)", [
            ("128GB", "Fusion White",   20, 21999m),
            ("128GB", "Exotic Green",   18, 21999m),
            ("256GB", "Fusion White",   15, null),
            ("256GB", "Exotic Green",   12, null),
            ("256GB", "Midnight Black", 10, null),
        ]);

        // ── Books — format variants ───────────────────────────────────────────
        AddFormats("Atomic Habits by James Clear", [
            ("Paperback", 150, null),
            ("Hardcover",  40, 549m),
            ("eBook",     999, 199m),
        ]);
        AddFormats("Rich Dad Poor Dad by Robert Kiyosaki", [
            ("Paperback", 120, null),
            ("Hardcover",  30, 499m),
            ("eBook",     999, 149m),
        ]);
        AddFormats("The Psychology of Money by Morgan Housel", [
            ("Paperback", 140, null),
            ("Hardcover",  35, 529m),
            ("eBook",     999, 149m),
        ]);
        AddFormats("Zero to One by Peter Thiel", [
            ("Paperback",  90, null),
            ("Hardcover",  25, 599m),
            ("eBook",     999, 199m),
        ]);
        AddFormats("The Alchemist by Paulo Coelho", [
            ("Paperback", 200, null),
            ("Hardcover",  60, 399m),
            ("eBook",     999,  99m),
        ]);
        AddFormats("Deep Work by Cal Newport", [
            ("Paperback",  80, null),
            ("Hardcover",  20, 649m),
            ("eBook",     999, 199m),
        ]);

        // ── Beauty — shade variants ───────────────────────────────────────────
        AddShades("Maybelline Fit Me Matte + Poreless Foundation", [
            "110 Porcelain", "118 Light Beige", "130 Buff Beige", "220 Natural Beige", "320 Natural Tan"
        ], 24);
        AddShades("Lakme 9 to 5 Flawless Matte Complexion Compact", [
            "Ivory Fair", "Salmon Pink", "Shell", "Warm Beige"
        ], 22);

        // ── Beauty — volume variants ──────────────────────────────────────────
        AddVolumes("Nivea Men Dark Spot Reduction Face Wash 100ml", [
            ("100ml", 80,  null),
            ("200ml", 50, 299m),
        ]);
        AddVolumes("L'Oreal Paris 3-in-1 Moisturizer 50ml", [
            ("30ml",  60,  null),
            ("50ml",  50,  null),
            ("100ml", 30, 899m),
        ]);
        AddVolumes("Biotique Bio Honey Gel Face Wash 150ml", [
            ("100ml", 120, null),
            ("150ml", 100, null),
        ]);

        // ── Home & Kitchen — color variants ───────────────────────────────────
        AddColors("Prestige Iris 750W Mixer Grinder with 3 Jars", ["Red", "White"], 35);
        AddColors("Philips HD9200 Air Fryer (4.1L, 1400W)", ["Black", "White"], 22);
        AddColors("Milton Thermosteel Flip Lid Flask 1000ml", ["Silver", "Red", "Blue"], 55);
        AddColors("Pigeon Induction Cooktop 1800W", ["Black", "White"], 40);
        AddColors("Bajaj Rex 500W Mixer Grinder", ["White", "Grey"], 50);
        AddColors("Amazon Basics Microfiber Cleaning Cloth (12 Pack)", ["Blue", "Grey", "Yellow"], 100);
        AddColors("Cello Plastic Airtight Container Set (6 Pieces)", ["Clear Blue", "Clear Red", "Clear"], 50);
        AddColors("Solimo 2-Burner LPG Gas Stove", ["Stainless Silver", "Matte Black"], 25);
        AddColors("Hafele Kitchen Chimney 60cm (1200 m³/hr)", ["Stainless Steel", "Black"], 14);

        // ── Sports ────────────────────────────────────────────────────────────
        AddColors("Yonex Muscle Power 29 Lite Badminton Racquet", ["Blue", "Red"], 37);
        AddSizes("Cosco Dribble Football Size 5", ["3", "4", "5"], 40);
        AddColors("Strauss Yoga Mat 6mm with Carry Strap", ["Purple", "Blue", "Green", "Black"], 50);

        // ── Footwear — gender × shoe size × color variants ───────────────────
        AddFootwear("Nike Air Max 270 Men's Running Shoes",
            ["Men"], ["UK 7", "UK 8", "UK 9", "UK 10", "UK 11"],
            ["White/Black", "Black/White", "Grey/Red"], 5);
        AddFootwear("Puma Men's Vikky V3 Sneakers",
            ["Men", "Women"], ["UK 5", "UK 6", "UK 7", "UK 8", "UK 9"],
            ["White", "Black", "Navy"], 5);
        AddFootwear("Adidas Men's Ultraboost 22 Running Shoes",
            ["Men"], ["UK 7", "UK 8", "UK 9", "UK 10", "UK 11"],
            ["Core Black", "Cloud White", "Grey"], 5);
        AddFootwear("Nike Women's Air Force 1 Sneakers",
            ["Women"], ["UK 3", "UK 4", "UK 5", "UK 6", "UK 7", "UK 8"],
            ["White", "Black", "Pink/White"], 5);
        AddFootwear("Reebok Classic Leather Men's Shoes",
            ["Men"], ["UK 7", "UK 8", "UK 9", "UK 10", "UK 11"],
            ["White", "Black", "Chalk"], 5);
        AddFootwear("Skechers Women's Go Walk Joy Walking Shoes",
            ["Women"], ["UK 3", "UK 4", "UK 5", "UK 6", "UK 7", "UK 8"],
            ["Black", "Navy", "Hot Pink"], 5);
        AddFootwear("Puma Women's Cali Sport Sneakers",
            ["Women"], ["UK 3", "UK 4", "UK 5", "UK 6", "UK 7"],
            ["White/Gold", "Black/Silver", "Rose/White"], 5);
        AddFootwear("Bata North Star Men's Canvas Shoes",
            ["Men"], ["UK 6", "UK 7", "UK 8", "UK 9", "UK 10", "UK 11"],
            ["Black", "White", "Navy Blue"], 5);

        // ── Grocery — weight variants ─────────────────────────────────────────
        AddWeights("Tata Tea Gold", [
            ("250g",  5,  null),
            ("500g",  5,  249m),
            ("1kg",   5,  449m),
        ]);
        AddWeights("Fortune Sunflower Oil", [
            ("1L",    5,  null),
            ("2L",    5,  279m),
            ("5L",    5,  649m),
        ]);
        AddWeights("Amul Butter", [
            ("100g",  5,  null),
            ("500g",  5,  265m),
        ]);
        AddWeights("Haldiram's Aloo Bhujia Namkeen", [
            ("200g",  5,  null),
            ("400g",  5,  149m),
            ("1kg",   5,  320m),
        ]);
        AddWeights("Maggi 2-Minute Noodles (12 Pack)", [
            ("12 Pack", 5, null),
        ]);

        // ── Toys — age group variants ─────────────────────────────────────────
        AddAgeGroups("LEGO Classic Creative Brick Box",     ["6-8 yrs", "9-12 yrs"], 5);
        AddAgeGroups("Funskool Candy Land Board Game",      ["3-5 yrs"], 5);
        AddAgeGroups("Hasbro Monopoly Classic Edition",     ["9-12 yrs", "12+ yrs"], 5);
        AddAgeGroups("Fisher-Price Laugh & Learn Baby Gym", ["0-2 yrs"], 5);
        AddAgeGroups("Hot Wheels 20-Car Gift Pack",         ["3-5 yrs", "6-8 yrs"], 5);

        if (variants.Count == 0) return;
        await db.ProductVariants.AddRangeAsync(variants);
        await db.SaveChangesAsync();
    }
}
