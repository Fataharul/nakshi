import { PrismaClient, Role, ModerationStatus, ArtworkAvailability, AuctionStatus, TransactionType } from '@prisma/client';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

// Verified Authentic Bangladeshi Heritage Image Assets (Local & CDN)
const HERITAGE_IMAGES = {
  // Avatars (Realistic portraits)
  avatars: {
    rokeya: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
    alkas: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    gouranga: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    sukumar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80',
    tanvir: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&q=80',
    sadia: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    farhan: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=200&q=80',
    naveed: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    anisur: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80',
    admin: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
  },
  // Authentic Cultural Heritage Crafts (Saved in client/public/images/heritage/)
  artworks: {
    jamdaniSonargaon: '/images/heritage/jamdani-sonargaon.jpg',
    jamdaniNilambari: '/images/heritage/jamdani-nilambari.jpg',
    jamdaniSaree: '/images/heritage/jamdani-saree.jpg',
    kanthaQuilt: '/images/heritage/nakshi-kantha-quilt.jpg',
    kanthaMayurpakkhi: '/images/heritage/kantha-mayurpakkhi.jpg',
    kanthaLotus: '/images/heritage/kantha-lotus.jpg',
    kanthaLotusVariant: '/images/heritage/kantha-lotus-variant.jpg',
    terracottaTemplePlaque: '/images/heritage/terracotta-temple-plaque.jpg',
    terracottaHorse: '/images/heritage/terracotta-horse.jpg',
    terracottaPitcher: '/images/heritage/terracotta-pitcher.jpg',
    brassPeacockLamp: '/images/heritage/brass-peacock-lamp.jpg',
    brassRitualPlate: '/images/heritage/brass-ritual-plate.jpg',
    shitalPatiMat: '/images/heritage/shital-pati-mat.jpg',
    bambooLamp: '/images/heritage/bamboo-lamp.jpg',
    juteTapestry: '/images/heritage/jute-tapestry.jpg',
    woodCarvedPanel: '/images/heritage/wood-carved-panel.jpg',
    folkRickshawArt: '/images/heritage/folk-rickshaw-art.jpg',
    patuaScrollPainting: '/images/heritage/patua-scroll-painting.jpg',
  },
};

async function main() {
  console.log('[Seed] Starting production-grade authentic heritage dataset seeding...');

  const saltRounds = 10;
  const commonPassword = await bcrypt.hash('Password123!', saltRounds);

  // ---------------------------------------------------------------------------
  // 1. Seed Real Users Across All 4 Roles
  // ---------------------------------------------------------------------------
  const seedUsers = [
    // BUYERS
    {
      email: 'buyer@nakshi.test',
      name: 'Tanvir Ahmed',
      role: Role.BUYER,
      bio: 'Lifelong collector of traditional Bengali textiles, antique Jamdani weaves, and heirloom Nakshi Kantha tapestries based in Dhanmondi, Dhaka.',
      avatarUrl: HERITAGE_IMAGES.avatars.tanvir,
      passwordHash: commonPassword,
      initialBalance: 3250.0,
    },
    {
      email: 'sadia@nakshi.test',
      name: 'Sadia Rahman',
      role: Role.BUYER,
      bio: 'Folk craft aficionado and patron of rural women artisans in Jessore, Bogura, and Rajshahi.',
      avatarUrl: HERITAGE_IMAGES.avatars.sadia,
      passwordHash: commonPassword,
      initialBalance: 1800.0,
    },
    {
      email: 'farhan@nakshi.test',
      name: 'Farhan Kabir',
      role: Role.BUYER,
      bio: 'Heritage architecture enthusiast curating authentic terracotta plaques and Dhamrai bell-metal sculptures.',
      avatarUrl: HERITAGE_IMAGES.avatars.farhan,
      passwordHash: commonPassword,
      initialBalance: 4500.0,
    },
    // ARTISTS
    {
      email: 'artist@nakshi.test',
      name: 'Rokeya Begum',
      role: Role.ARTIST,
      bio: 'Master artisan from Jessore with 38 years of experience in hand-embroidered heirloom Nakshi Kantha tapestries and rural folklore motifs.',
      avatarUrl: HERITAGE_IMAGES.avatars.rokeya,
      isVerified: true,
      passwordHash: commonPassword,
      initialBalance: 1850.0,
    },
    {
      email: 'alkas@nakshi.test',
      name: 'Alkas Mia',
      role: Role.ARTIST,
      bio: 'Third-generation master weaver from Sonargaon practicing 200-count traditional pit-loom Jamdani and pure zari craftsmanship.',
      avatarUrl: HERITAGE_IMAGES.avatars.alkas,
      isVerified: true,
      passwordHash: commonPassword,
      initialBalance: 2400.0,
    },
    {
      email: 'gouranga@nakshi.test',
      name: 'Gouranga Pal',
      role: Role.ARTIST,
      bio: 'Traditional terracotta sculptor and potter from Panchagarh specializing in wood-fired red river silt plaques and horse motifs.',
      avatarUrl: HERITAGE_IMAGES.avatars.gouranga,
      isVerified: true,
      passwordHash: commonPassword,
      initialBalance: 950.0,
    },
    {
      email: 'sukumar@nakshi.test',
      name: 'Sukumar Banik',
      role: Role.ARTIST,
      bio: 'Dhamrai bell metal and brass craftsman continuing a 500-year familial heritage in lost-wax ceremonial casting.',
      avatarUrl: HERITAGE_IMAGES.avatars.sukumar,
      isVerified: true,
      passwordHash: commonPassword,
      initialBalance: 1400.0,
    },
    // EXHIBITION ORGANIZERS
    {
      email: 'organizer@nakshi.test',
      name: 'Naveed Chowdhury',
      role: Role.ORGANIZER,
      bio: 'Lead curator at the Bengal Heritage Foundation and designer of immersive digital folk craft exhibitions.',
      avatarUrl: HERITAGE_IMAGES.avatars.naveed,
      isVerified: true,
      passwordHash: commonPassword,
      initialBalance: 800.0,
    },
    {
      email: 'anisur@nakshi.test',
      name: 'Dr. Anisur Rahman',
      role: Role.ORGANIZER,
      bio: 'Senior Folklorist and Director at the Dhaka Folk Antiquities Guild.',
      avatarUrl: HERITAGE_IMAGES.avatars.anisur,
      isVerified: true,
      passwordHash: commonPassword,
      initialBalance: 1200.0,
    },
    // ADMINISTRATORS
    {
      email: 'admin@nakshi.test',
      name: 'Nakshi Administrator',
      role: Role.ADMIN,
      bio: 'Platform trust & integrity guardian overseeing perceptual duplicate moderation, authentic provenance, and auction settlements.',
      avatarUrl: HERITAGE_IMAGES.avatars.admin,
      isVerified: true,
      passwordHash: commonPassword,
      initialBalance: 10000.0,
    },
  ];

  const userMap = new Map<string, any>();

  for (const u of seedUsers) {
    const existing = await prisma.user.findUnique({ where: { email: u.email } });
    let userRecord: any;
    if (existing) {
      userRecord = await prisma.user.update({
        where: { email: u.email },
        data: {
          name: u.name,
          role: u.role,
          bio: u.bio,
          avatarUrl: u.avatarUrl,
          isVerified: u.isVerified ?? false,
          passwordHash: u.passwordHash,
        },
      });
      console.log(`[Seed] Updated user: ${u.email} (${u.role})`);
    } else {
      userRecord = await prisma.user.create({
        data: {
          email: u.email,
          name: u.name,
          role: u.role,
          bio: u.bio,
          avatarUrl: u.avatarUrl,
          isVerified: u.isVerified ?? false,
          passwordHash: u.passwordHash,
        },
      });
      console.log(`[Seed] Created user: ${u.email} (${u.role})`);
    }

    userMap.set(u.email, userRecord);

    // Setup wallet with initial balance
    const wallet = await prisma.wallet.findUnique({ where: { userId: userRecord.id } });
    if (!wallet) {
      const createdWallet = await prisma.wallet.create({
        data: {
          userId: userRecord.id,
          balance: u.initialBalance,
        },
      });
      await prisma.creditTransaction.create({
        data: {
          walletId: createdWallet.id,
          amount: u.initialBalance,
          type: TransactionType.TOP_UP,
          description: 'Initial platform onboarding grant',
        },
      });
    } else {
      await prisma.wallet.update({
        where: { id: wallet.id },
        data: { balance: u.initialBalance },
      });
    }
  }

  const artistRokeya = userMap.get('artist@nakshi.test');
  const artistAlkas = userMap.get('alkas@nakshi.test');
  const artistGouranga = userMap.get('gouranga@nakshi.test');
  const artistSukumar = userMap.get('sukumar@nakshi.test');
  const buyerTanvir = userMap.get('buyer@nakshi.test');
  const buyerSadia = userMap.get('sadia@nakshi.test');
  const buyerFarhan = userMap.get('farhan@nakshi.test');
  const organizerNaveed = userMap.get('organizer@nakshi.test');
  const organizerAnisur = userMap.get('anisur@nakshi.test');
  const adminUser = userMap.get('admin@nakshi.test');

  // ---------------------------------------------------------------------------
  // 2. Seed 24 Authentic Cultural Heritage Artworks
  // ---------------------------------------------------------------------------
  const rawArtworks = [
    // JAMDANI WEAVING (Master Artisan Alkas Mia)
    {
      title: 'Sonargaon Royal Red-Gold Zari Jamdani',
      description: 'Handwoven on an indigenous pit-loom in Sonargaon using 200-count fine cotton muslin. Features supplementary-weft gold zari in traditional panna hazar (thousand emeralds) and kalka (paisley) patterns across the sheer crimson-red body.',
      medium: 'Jamdani Weaving',
      style: 'Traditional Geometric Pit-Loom',
      dimensions: '5.5m x 1.2m',
      height: 550,
      width: 120,
      depth: 0.1,
      weight: 0.45,
      weightUnit: 'kg',
      price: 1250.0,
      imageUrl: HERITAGE_IMAGES.artworks.jamdaniSonargaon,
      like: 48,
      availability: ArtworkAvailability.AVAILABLE,
      moderationStatus: ModerationStatus.APPROVED,
      artistId: artistAlkas.id,
    },
    {
      title: 'Nilambari Midnight-Indigo Jamdani Saree',
      description: 'Draped in natural indigo dye with fine silver-toned floral vine (tercha) needlework motifs. An heirloom ceremonial piece celebrated across Old Dhaka wedding ceremonies.',
      medium: 'Jamdani Weaving',
      style: 'Nilambari Floral Border',
      dimensions: '5.5m x 1.15m',
      height: 550,
      width: 115,
      depth: 0.1,
      weight: 0.42,
      weightUnit: 'kg',
      price: 980.0,
      imageUrl: HERITAGE_IMAGES.artworks.jamdaniNilambari,
      like: 34,
      availability: ArtworkAvailability.AVAILABLE,
      moderationStatus: ModerationStatus.APPROVED,
      artistId: artistAlkas.id,
    },
    {
      title: 'Peacock-Teal Dhakai Silk Jamdani',
      description: 'Exquisite teal silk blend handloom with antique gold zari border. Combines geometric jaal patterns with traditional peacock crests along the pallu.',
      medium: 'Jamdani Weaving',
      style: 'Royal Zari Weave',
      dimensions: '5.5m x 1.2m',
      height: 550,
      width: 120,
      depth: 0.1,
      weight: 0.48,
      weightUnit: 'kg',
      price: 1450.0,
      imageUrl: HERITAGE_IMAGES.artworks.jamdaniSaree,
      like: 62,
      availability: ArtworkAvailability.AVAILABLE,
      moderationStatus: ModerationStatus.APPROVED,
      artistId: artistAlkas.id,
    },
    {
      title: 'Sonargaon Rose-Petal Fine Muslin Scarf',
      description: 'Delicate lightweight artisanal stole woven from pure combed cotton with hand-inserted floral butidar motifs.',
      medium: 'Jamdani Weaving',
      style: 'Butidar Muslin',
      dimensions: '2.0m x 0.7m',
      height: 200,
      width: 70,
      depth: 0.1,
      weight: 0.15,
      weightUnit: 'kg',
      price: 320.0,
      imageUrl: HERITAGE_IMAGES.artworks.jamdaniSonargaon,
      like: 19,
      availability: ArtworkAvailability.AVAILABLE,
      moderationStatus: ModerationStatus.APPROVED,
      artistId: artistAlkas.id,
    },

    // NAKSHI KANTHA (Master Artisan Rokeya Begum)
    {
      title: 'Gram Bangla Heirloom Nakshi Kantha',
      description: 'Monumental hand-quilted cotton tapestry from Jessore capturing daily rural village folklore: peasant life, paddy harvesting, river boats, elephants, and Bengal flora stitched with multicolored cotton threads.',
      medium: 'Nakshi Kantha',
      style: 'Rural Village Folklore',
      dimensions: '210cm x 150cm',
      height: 210,
      width: 150,
      depth: 0.8,
      weight: 1.85,
      weightUnit: 'kg',
      price: 1100.0,
      imageUrl: HERITAGE_IMAGES.artworks.kanthaQuilt,
      like: 79,
      availability: ArtworkAvailability.AVAILABLE,
      moderationStatus: ModerationStatus.APPROVED,
      artistId: artistRokeya.id,
    },
    {
      title: 'Mayurpakkhi Peacock Boat Quilted Tapestry',
      description: 'Pictorial kantha depicting the legendary Mayurpakkhi royal peacock boat gliding over river waves, surrounded by undulating lotus vines and running kantha ripple stitches.',
      medium: 'Nakshi Kantha',
      style: 'Riverine Peacock Motif',
      dimensions: '180cm x 135cm',
      height: 180,
      width: 135,
      depth: 0.6,
      weight: 1.4,
      weightUnit: 'kg',
      price: 750.0,
      imageUrl: HERITAGE_IMAGES.artworks.kanthaMayurpakkhi,
      like: 53,
      availability: ArtworkAvailability.AVAILABLE,
      moderationStatus: ModerationStatus.APPROVED,
      artistId: artistRokeya.id,
    },
    {
      title: 'Padma Medallion Heirloom Kantha',
      description: 'Classical central lotus medallion (Padma phul) with radiating concentric floral needlework, framed by geometric calculated borders and corner paisleys.',
      medium: 'Nakshi Kantha',
      style: 'Concentric Lotus Needlework',
      dimensions: '160cm x 160cm',
      height: 160,
      width: 160,
      depth: 0.5,
      weight: 1.25,
      weightUnit: 'kg',
      price: 850.0,
      imageUrl: HERITAGE_IMAGES.artworks.kanthaLotus,
      imageHash: '2f1ad002ac7b3b00', // MD5 fallback hash for kantha-lotus.jpg
      like: 41,
      availability: ArtworkAvailability.AVAILABLE,
      moderationStatus: ModerationStatus.APPROVED,
      artistId: artistRokeya.id,
    },
    {
      title: 'Padma Phul Kantha Tapestry (Variant Edition)',
      description: 'Second-edition embroidered kantha wall piece with rust-orange and sage green thread palette, matching the archival Padma lotus medallion layout.',
      medium: 'Nakshi Kantha',
      style: 'Concentric Lotus Needlework',
      dimensions: '160cm x 160cm',
      height: 160,
      width: 160,
      depth: 0.5,
      weight: 1.25,
      weightUnit: 'kg',
      price: 840.0,
      imageUrl: HERITAGE_IMAGES.artworks.kanthaLotusVariant,
      imageHash: 'accc11f8db67b92d', // MD5 fallback hash for kantha-lotus-variant.jpg
      like: 12,
      availability: ArtworkAvailability.AVAILABLE,
      moderationStatus: ModerationStatus.FLAGGED, // Flagged for duplicate review (88.4% match)
      artistId: artistRokeya.id,
    },
    {
      title: 'Rajshahi Silk-Embroidered Paisley Runner',
      description: 'Table runner crafted with pure Rajshahi silk base and Jessore running kantha embroidery in crimson and gold.',
      medium: 'Nakshi Kantha',
      style: 'Running Stitch Table Runner',
      dimensions: '140cm x 40cm',
      height: 140,
      width: 40,
      depth: 0.3,
      weight: 0.35,
      weightUnit: 'kg',
      price: 290.0,
      imageUrl: HERITAGE_IMAGES.artworks.kanthaQuilt,
      like: 27,
      availability: ArtworkAvailability.AVAILABLE,
      moderationStatus: ModerationStatus.APPROVED,
      artistId: artistRokeya.id,
    },

    // TERRACOTTA POTTERY & RELIEF ART (Master Sculptor Gouranga Pal)
    {
      title: 'Kantajew Temple Classical Terracotta Plaque',
      description: 'Museum-displayed architectural relief tile inspired by the 18th-century Kantaji Temple in Dinajpur. Molded from alluvial burnt river clay depicting classical dancers, floral vines, and rural Bengali motifs.',
      medium: 'Terracotta Pottery',
      style: '18th Century Temple Relief',
      dimensions: '45cm x 35cm x 5cm',
      height: 45,
      width: 35,
      depth: 5,
      weight: 4.8,
      weightUnit: 'kg',
      price: 520.0,
      imageUrl: HERITAGE_IMAGES.artworks.terracottaTemplePlaque,
      like: 67,
      availability: ArtworkAvailability.AVAILABLE,
      moderationStatus: ModerationStatus.APPROVED,
      artistId: artistGouranga.id,
    },
    {
      title: 'Bengal Riverbank Terracotta Horse Sculpture',
      description: 'Hand-sculpted Bankura-style votive terracotta horse figurine created with natural river clay from the Karatoya riverbed. Features distinctive erect ears, ornate neck rosettes, and sun-baked earthen finish.',
      medium: 'Terracotta Pottery',
      style: 'Traditional Clay Figurine',
      dimensions: '38cm x 22cm x 12cm',
      height: 38,
      width: 22,
      depth: 12,
      weight: 2.9,
      weightUnit: 'kg',
      price: 360.0,
      imageUrl: HERITAGE_IMAGES.artworks.terracottaHorse,
      like: 45,
      availability: ArtworkAvailability.AVAILABLE,
      moderationStatus: ModerationStatus.APPROVED,
      artistId: artistGouranga.id,
    },
    {
      title: 'Carved Red Clay Water Pitcher (Kolshi)',
      description: 'Wheel-thrown red terracotta water vessel with hand-incised geometric fluting around the shoulder and a polished riverstone burnish.',
      medium: 'Terracotta Pottery',
      style: 'Hand-Etched Red Silt',
      dimensions: '32cm x 26cm x 26cm',
      height: 32,
      width: 26,
      depth: 26,
      weight: 2.1,
      weightUnit: 'kg',
      price: 180.0,
      imageUrl: HERITAGE_IMAGES.artworks.terracottaPitcher,
      like: 23,
      availability: ArtworkAvailability.AVAILABLE,
      moderationStatus: ModerationStatus.APPROVED,
      artistId: artistGouranga.id,
    },
    {
      title: 'Panchagarh Clay Miniature Horse Trio',
      description: 'Set of three miniature votive clay horses with traditional folk slip decoration.',
      medium: 'Terracotta Pottery',
      style: 'Miniature Folk Sculptures',
      dimensions: '18cm x 12cm x 6cm',
      height: 18,
      width: 12,
      depth: 6,
      weight: 1.1,
      weightUnit: 'kg',
      price: 140.0,
      imageUrl: HERITAGE_IMAGES.artworks.terracottaHorse,
      like: 16,
      availability: ArtworkAvailability.AVAILABLE,
      moderationStatus: ModerationStatus.REJECTED, // Flagged & rejected duplicate review test case
      artistId: artistGouranga.id,
    },

    // BELL METAL & BRASS CRAFT (Master Craftsman Sukumar Banik)
    {
      title: 'Dhamrai Lost-Wax Brass Peacock Oil Lamp',
      description: 'Ceremonial Mayur Deepam cast using a 500-year-old familial lost-wax technique in Dhamrai. Features a sculpted peacock crowning the oil reservoir with tiered wick spouts on a flared pedestaled base.',
      medium: 'Bell Metal Craft',
      style: 'Ceremonial Mayur Deepam',
      dimensions: '52cm x 24cm x 24cm',
      height: 52,
      width: 24,
      depth: 24,
      weight: 5.4,
      weightUnit: 'kg',
      price: 780.0,
      imageUrl: HERITAGE_IMAGES.artworks.brassPeacockLamp,
      like: 58,
      availability: ArtworkAvailability.AVAILABLE,
      moderationStatus: ModerationStatus.APPROVED,
      artistId: artistSukumar.id,
    },
    {
      title: 'Hand-Chiseled Kansa Bell-Metal Ritual Thali',
      description: 'Heavy bronze/kansa circular serving platter with hand-chiseled concentric lotus petal motifs and traditional scrollwork. Resonant acoustic bell-metal alloy.',
      medium: 'Bell Metal Craft',
      style: 'Traditional Engraved Bronze',
      dimensions: '36cm x 36cm x 3.5cm',
      height: 36,
      width: 36,
      depth: 3.5,
      weight: 3.2,
      weightUnit: 'kg',
      price: 440.0,
      imageUrl: HERITAGE_IMAGES.artworks.brassRitualPlate,
      imageHash: '625ea2a4e1244250', // MD5 fallback hash for brass-ritual-plate.jpg
      like: 31,
      availability: ArtworkAvailability.AVAILABLE,
      moderationStatus: ModerationStatus.APPROVED,
      artistId: artistSukumar.id,
    },
    {
      title: 'Dhamrai Bell-Metal Temple Gong & Mallet',
      description: 'Cast bronze meditation gong with rich overtones, finished with an antique burnished rim and carved rosewood mallet.',
      medium: 'Bell Metal Craft',
      style: 'Temple Acoustic Bronze',
      dimensions: '40cm x 40cm x 6cm',
      height: 40,
      width: 40,
      depth: 6,
      weight: 4.1,
      weightUnit: 'kg',
      price: 490.0,
      imageUrl: HERITAGE_IMAGES.artworks.brassRitualPlate,
      imageHash: '625ea2a4e1244250', // MD5 fallback hash for brass-ritual-plate.jpg (matches Ritual Thali => duplicate)
      like: 29,
      availability: ArtworkAvailability.AVAILABLE,
      moderationStatus: ModerationStatus.FLAGGED, // Duplicate of Hand-Chiseled Kansa Bell-Metal Ritual Thali
      artistId: artistSukumar.id,
    },

    // SHITAL PATI & CANE CRAFT
    {
      title: 'Sylhet Murta Cane Diamond Weave Shital Pati',
      description: 'Traditional cooling mat woven from Murta cane strips (Schumannianthus dichotomus) in Balaganj, Sylhet. Smooth, cool-to-touch surface featuring diagonal diamond chechan weave patterns.',
      medium: 'Shital Pati',
      style: 'Chechan Diamond Weave',
      dimensions: '190cm x 130cm',
      height: 190,
      width: 130,
      depth: 0.2,
      weight: 0.95,
      weightUnit: 'kg',
      price: 380.0,
      imageUrl: HERITAGE_IMAGES.artworks.shitalPatiMat,
      like: 47,
      availability: ArtworkAvailability.AVAILABLE,
      moderationStatus: ModerationStatus.APPROVED,
      artistId: artistRokeya.id,
    },
    {
      title: 'Handcrafted Bamboo Lattice Pendant Lamp',
      description: 'Contemporary overhead ceiling light woven with fine bamboo lattice strips, emitting warm ambient honey rays across modern living spaces.',
      medium: 'Bamboo & Cane Craft',
      style: 'Contemporary Woven Cane',
      dimensions: '42cm x 38cm x 38cm',
      height: 42,
      width: 38,
      depth: 38,
      weight: 0.8,
      weightUnit: 'kg',
      price: 260.0,
      imageUrl: HERITAGE_IMAGES.artworks.bambooLamp,
      like: 71,
      availability: ArtworkAvailability.AVAILABLE,
      moderationStatus: ModerationStatus.APPROVED,
      artistId: artistRokeya.id,
    },

    // JUTE CRAFT
    {
      title: 'Golden Fiber Braided Jute Wall Hanging',
      description: 'Artisan wall hanging hand-knotted from unbleached golden jute fiber of Chandpur. Features geometric chevron macramé and cascading fringe tassels.',
      medium: 'Jute Craft',
      style: 'Hand-Knotted Macramé Tapestry',
      dimensions: '110cm x 65cm',
      height: 110,
      width: 65,
      depth: 2,
      weight: 1.1,
      weightUnit: 'kg',
      price: 210.0,
      imageUrl: HERITAGE_IMAGES.artworks.juteTapestry,
      imageHash: '1938fad7c339323c', // MD5 fallback hash for jute-tapestry.jpg
      like: 38,
      availability: ArtworkAvailability.AVAILABLE,
      moderationStatus: ModerationStatus.APPROVED,
      artistId: artistRokeya.id,
    },
    {
      title: 'Noakhali Golden Jute Braided Floor Rug',
      description: 'Durable circular braided jute area rug woven with spiral concentric coils from natural Bangladeshi jute.',
      medium: 'Jute Craft',
      style: 'Spiral Braided Floor Mat',
      dimensions: '150cm x 150cm',
      height: 150,
      width: 150,
      depth: 1.5,
      weight: 3.4,
      weightUnit: 'kg',
      price: 240.0,
      imageUrl: HERITAGE_IMAGES.artworks.juteTapestry,
      imageHash: '1938fad7c339323c', // MD5 fallback hash for jute-tapestry.jpg (matches Wall Hanging => duplicate)
      like: 33,
      availability: ArtworkAvailability.AVAILABLE,
      moderationStatus: ModerationStatus.FLAGGED, // Duplicate of Golden Fiber Braided Jute Wall Hanging
      artistId: artistRokeya.id,
    },

    // TRADITIONAL WOOD CARVING
    {
      title: 'Carved Teakwood Floral Relief Panel',
      description: 'Deep architectural wood relief carved from aged Chittagong teak. Showcases blooming lotus medallions and botanical jali arches with a satin natural oil polish.',
      medium: 'Wood Carving',
      style: 'Deep Relief Botanical Jali',
      dimensions: '75cm x 45cm x 4cm',
      height: 75,
      width: 45,
      depth: 4,
      weight: 4.5,
      weightUnit: 'kg',
      price: 640.0,
      imageUrl: HERITAGE_IMAGES.artworks.woodCarvedPanel,
      like: 55,
      availability: ArtworkAvailability.AVAILABLE,
      moderationStatus: ModerationStatus.APPROVED,
      artistId: artistSukumar.id,
    },

    // RICKSHAW & PATUA FOLK ART
    {
      title: 'Vibrant Dhaka Rickshaw Tinplate Art (Peacock & Lotus)',
      description: 'Hand-painted enamel Rickshaw art on tin plate by Old Dhaka master ustad. Bold, electric colors depicting a royal peacock resting on lotus blossoms with heart and floral filigree borders.',
      medium: 'Rickshaw & Folk Art',
      style: 'Dhaka Enamel Street Folk Art',
      dimensions: '50cm x 40cm',
      height: 50,
      width: 40,
      depth: 0.2,
      weight: 0.6,
      weightUnit: 'kg',
      price: 310.0,
      imageUrl: HERITAGE_IMAGES.artworks.folkRickshawArt,
      imageHash: '8c68394a141bee22', // MD5 fallback hash for folk-rickshaw-art.jpg
      like: 92,
      availability: ArtworkAvailability.AVAILABLE,
      moderationStatus: ModerationStatus.APPROVED,
      artistId: artistRokeya.id,
    },
    {
      title: 'Old Dhaka Floral Rickshaw Hood Panel',
      description: 'Painted vinyl rickshaw canopy panel featuring vibrant folk floral bouquets and decorative crests.',
      medium: 'Rickshaw & Folk Art',
      style: 'Enamel Rickshaw Canopy',
      dimensions: '60cm x 45cm',
      height: 60,
      width: 45,
      depth: 0.3,
      weight: 0.5,
      weightUnit: 'kg',
      price: 220.0,
      imageUrl: HERITAGE_IMAGES.artworks.folkRickshawArt,
      imageHash: '8c68394a141bee22', // MD5 fallback hash for folk-rickshaw-art.jpg (matches Peacock & Lotus => duplicate)
      like: 44,
      availability: ArtworkAvailability.AVAILABLE,
      moderationStatus: ModerationStatus.FLAGGED, // Duplicate of Vibrant Dhaka Rickshaw Tinplate Art
      artistId: artistRokeya.id,
    },
    {
      title: 'Bengal Patachitra Folk Scroll (Baul Dancers)',
      description: 'Traditional Kalighat/Patachitra scroll painted on handmade cloth-backed paper using organic natural pigments. Depicts rural Baul mystical singers and dancers under a sacred banyan tree.',
      medium: 'Patua Folk Painting',
      style: 'Kalighat Organic Pigment Scroll',
      dimensions: '90cm x 55cm',
      height: 90,
      width: 55,
      depth: 0.2,
      weight: 0.4,
      weightUnit: 'kg',
      price: 410.0,
      imageUrl: HERITAGE_IMAGES.artworks.patuaScrollPainting,
      like: 68,
      availability: ArtworkAvailability.AVAILABLE,
      moderationStatus: ModerationStatus.APPROVED,
      artistId: artistRokeya.id,
    },
  ];

  const artworkMap = new Map<string, any>();

  for (const art of rawArtworks) {
    const existing = await prisma.artwork.findFirst({
      where: { title: art.title, artistId: art.artistId },
    });

    let record: any;
    if (existing) {
      record = await prisma.artwork.update({
        where: { id: existing.id },
        data: art,
      });
      console.log(`[Seed] Updated artwork: "${art.title}"`);
    } else {
      record = await prisma.artwork.create({
        data: art,
      });
      console.log(`[Seed] Created artwork: "${art.title}"`);
    }

    artworkMap.set(art.title, record);
  }

  // ---------------------------------------------------------------------------
  // 3. Seed Authentic Auctions (Active, Upcoming, and Closed with NO duplicates)
  // ---------------------------------------------------------------------------
  const now = new Date();
  const threeDaysAhead = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const fiveDaysAhead = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
  const oneDayAgo = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);
  const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
  const twoDaysAhead = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
  const fourDaysAhead = new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000);

  const sonargaonJamdani = artworkMap.get('Sonargaon Royal Red-Gold Zari Jamdani');
  const brassLamp = artworkMap.get('Dhamrai Lost-Wax Brass Peacock Oil Lamp');
  const terracottaPlaque = artworkMap.get('Kantajew Temple Classical Terracotta Plaque');
  const mayurpakkhiKantha = artworkMap.get('Mayurpakkhi Peacock Boat Quilted Tapestry');
  const terracottaHorse = artworkMap.get('Bengal Riverbank Terracotta Horse Sculpture');
  const bambooLamp = artworkMap.get('Handcrafted Bamboo Lattice Pendant Lamp');
  const tealJamdani = artworkMap.get('Peacock-Teal Dhakai Silk Jamdani');

  const auctionSeeds = [
    // 1. ACTIVE AUCTION 1
    {
      artworkId: sonargaonJamdani.id,
      startingBid: 800.0,
      currentHighestBid: 1150.0,
      minIncrement: 50.0,
      startTime: oneDayAgo,
      endTime: threeDaysAhead,
      status: AuctionStatus.ACTIVE,
      winnerId: null,
      bids: [
        { bidderId: buyerTanvir.id, amount: 850.0, createdAt: new Date(now.getTime() - 18 * 3600 * 1000) },
        { bidderId: buyerFarhan.id, amount: 950.0, createdAt: new Date(now.getTime() - 14 * 3600 * 1000) },
        { bidderId: buyerTanvir.id, amount: 1050.0, createdAt: new Date(now.getTime() - 8 * 3600 * 1000) },
        { bidderId: buyerFarhan.id, amount: 1150.0, createdAt: new Date(now.getTime() - 2 * 3600 * 1000) },
      ],
    },
    // 2. ACTIVE AUCTION 2
    {
      artworkId: brassLamp.id,
      startingBid: 600.0,
      currentHighestBid: 780.0,
      minIncrement: 40.0,
      startTime: oneDayAgo,
      endTime: fiveDaysAhead,
      status: AuctionStatus.ACTIVE,
      winnerId: null,
      bids: [
        { bidderId: buyerSadia.id, amount: 640.0, createdAt: new Date(now.getTime() - 16 * 3600 * 1000) },
        { bidderId: buyerTanvir.id, amount: 720.0, createdAt: new Date(now.getTime() - 10 * 3600 * 1000) },
        { bidderId: buyerSadia.id, amount: 780.0, createdAt: new Date(now.getTime() - 3 * 3600 * 1000) },
      ],
    },
    // 3. UPCOMING AUCTION 1
    {
      artworkId: terracottaPlaque.id,
      startingBid: 450.0,
      currentHighestBid: null,
      minIncrement: 30.0,
      startTime: twoDaysAhead,
      endTime: fiveDaysAhead,
      status: AuctionStatus.UPCOMING,
      winnerId: null,
      bids: [],
    },
    // 4. UPCOMING AUCTION 2
    {
      artworkId: mayurpakkhiKantha.id,
      startingBid: 700.0,
      currentHighestBid: null,
      minIncrement: 50.0,
      startTime: threeDaysAhead,
      endTime: fourDaysAhead,
      status: AuctionStatus.UPCOMING,
      winnerId: null,
      bids: [],
    },
    // 5. CLOSED AUCTION 1 (Unique artwork)
    {
      artworkId: terracottaHorse.id,
      startingBid: 300.0,
      currentHighestBid: 520.0,
      minIncrement: 25.0,
      startTime: fiveDaysAgo,
      endTime: oneDayAgo,
      status: AuctionStatus.CLOSED,
      winnerId: buyerTanvir.id,
      bids: [
        { bidderId: buyerSadia.id, amount: 350.0, createdAt: new Date(now.getTime() - 4 * 24 * 3600 * 1000) },
        { bidderId: buyerTanvir.id, amount: 520.0, createdAt: new Date(now.getTime() - 2 * 24 * 3600 * 1000) },
      ],
    },
    // 6. CLOSED AUCTION 2 (Unique artwork)
    {
      artworkId: bambooLamp.id,
      startingBid: 200.0,
      currentHighestBid: 320.0,
      minIncrement: 20.0,
      startTime: fiveDaysAgo,
      endTime: oneDayAgo,
      status: AuctionStatus.CLOSED,
      winnerId: buyerSadia.id,
      bids: [
        { bidderId: buyerTanvir.id, amount: 240.0, createdAt: new Date(now.getTime() - 4 * 24 * 3600 * 1000) },
        { bidderId: buyerSadia.id, amount: 320.0, createdAt: new Date(now.getTime() - 2 * 24 * 3600 * 1000) },
      ],
    },
    // 7. CLOSED AUCTION 3 (Unique artwork)
    {
      artworkId: tealJamdani.id,
      startingBid: 1200.0,
      currentHighestBid: 1550.0,
      minIncrement: 50.0,
      startTime: fiveDaysAgo,
      endTime: oneDayAgo,
      status: AuctionStatus.CLOSED,
      winnerId: buyerFarhan.id,
      bids: [
        { bidderId: buyerTanvir.id, amount: 1350.0, createdAt: new Date(now.getTime() - 4 * 24 * 3600 * 1000) },
        { bidderId: buyerFarhan.id, amount: 1550.0, createdAt: new Date(now.getTime() - 2 * 24 * 3600 * 1000) },
      ],
    },
  ];

  for (const auc of auctionSeeds) {
    const existingAuc = await prisma.auction.findFirst({
      where: { artworkId: auc.artworkId },
    });

    let createdAuc: any;
    if (existingAuc) {
      createdAuc = await prisma.auction.update({
        where: { id: existingAuc.id },
        data: {
          startingBid: auc.startingBid,
          currentHighestBid: auc.currentHighestBid,
          minIncrement: auc.minIncrement,
          startTime: auc.startTime,
          endTime: auc.endTime,
          status: auc.status,
          winnerId: auc.winnerId,
        },
      });
      console.log(`[Seed] Updated auction for artwork: ${auc.artworkId} (${auc.status})`);
    } else {
      createdAuc = await prisma.auction.create({
        data: {
          artworkId: auc.artworkId,
          startingBid: auc.startingBid,
          currentHighestBid: auc.currentHighestBid,
          minIncrement: auc.minIncrement,
          startTime: auc.startTime,
          endTime: auc.endTime,
          status: auc.status,
          winnerId: auc.winnerId,
        },
      });
      console.log(`[Seed] Created auction for artwork: ${auc.artworkId} (${auc.status})`);
    }

    // Seed bids
    for (const bid of auc.bids) {
      const existingBid = await prisma.auctionBid.findFirst({
        where: { auctionId: createdAuc.id, bidderId: bid.bidderId, amount: bid.amount },
      });
      if (!existingBid) {
        await prisma.auctionBid.create({
          data: {
            auctionId: createdAuc.id,
            bidderId: bid.bidderId,
            amount: bid.amount,
            createdAt: bid.createdAt,
          },
        });
      }
    }
  }

  // ---------------------------------------------------------------------------
  // 4. Seed Authentic Moderation Reviews (Duplicate Detection Console)
  // ---------------------------------------------------------------------------
  const kanthaLotus = artworkMap.get('Padma Medallion Heirloom Kantha');
  const kanthaVariant = artworkMap.get('Padma Phul Kantha Tapestry (Variant Edition)');
  const scarfPiece = artworkMap.get('Sonargaon Rose-Petal Fine Muslin Scarf');
  const miniatureTrio = artworkMap.get('Panchagarh Clay Miniature Horse Trio');

  // Clear any existing stale moderation records
  await prisma.moderationReview.deleteMany({});

  // 1. PENDING REVIEW: Intricate 88.4% match for the Admin Queue
  await prisma.moderationReview.create({
    data: {
      sourceArtworkId: kanthaVariant.id,
      suspectedMatchId: kanthaLotus.id,
      similarityScore: 88.4,
      adminId: null,
      actionTaken: null,
      adminNotes: null,
      createdAt: new Date(now.getTime() - 2 * 3600 * 1000), // 2 hours ago
      reviewedAt: null,
    },
  });
  console.log('[Seed] Created Pending Duplicate Moderation Review: Padma Phul Kantha Variant vs Heirloom Kantha (88.4%)');

  // Artwork references for new pending duplicate pairs
  const ritualThali = artworkMap.get('Hand-Chiseled Kansa Bell-Metal Ritual Thali');
  const templeGong = artworkMap.get('Dhamrai Bell-Metal Temple Gong & Mallet');
  const rickshawPeacock = artworkMap.get('Vibrant Dhaka Rickshaw Tinplate Art (Peacock & Lotus)');
  const rickshawHood = artworkMap.get('Old Dhaka Floral Rickshaw Hood Panel');
  const juteWallHanging = artworkMap.get('Golden Fiber Braided Jute Wall Hanging');
  const juteFloorRug = artworkMap.get('Noakhali Golden Jute Braided Floor Rug');

  // 2. PENDING REVIEW: Bell-Metal duplicate — Temple Gong vs Ritual Thali (100% hash match)
  await prisma.moderationReview.create({
    data: {
      sourceArtworkId: templeGong.id,
      suspectedMatchId: ritualThali.id,
      similarityScore: 100.0,
      adminId: null,
      actionTaken: null,
      adminNotes: 'Identical image hash detected by perceptual dHash engine. Possible duplicate listing by same artist.',
      createdAt: new Date(now.getTime() - 4 * 3600 * 1000), // 4 hours ago
      reviewedAt: null,
    },
  });
  console.log('[Seed] Created Pending Duplicate Moderation Review: Temple Gong vs Ritual Thali (100%)');;

  // 3. PENDING REVIEW: Folk Art duplicate — Rickshaw Hood Panel vs Peacock Tinplate (100% hash match)
  await prisma.moderationReview.create({
    data: {
      sourceArtworkId: rickshawHood.id,
      suspectedMatchId: rickshawPeacock.id,
      similarityScore: 100.0,
      adminId: null,
      actionTaken: null,
      adminNotes: 'Exact image match flagged by visual similarity engine. Rickshaw hood panel shares identical artwork source.',
      createdAt: new Date(now.getTime() - 7 * 3600 * 1000), // 7 hours ago
      reviewedAt: null,
    },
  });
  console.log('[Seed] Created Pending Duplicate Moderation Review: Rickshaw Hood Panel vs Peacock Tinplate Art (100%)');;

  // 4. PENDING REVIEW: Jute Craft duplicate — Floor Rug vs Wall Hanging (100% hash match)
  await prisma.moderationReview.create({
    data: {
      sourceArtworkId: juteFloorRug.id,
      suspectedMatchId: juteWallHanging.id,
      similarityScore: 100.0,
      adminId: null,
      actionTaken: null,
      adminNotes: 'Same image file identified across two separate listings. Automatic duplicate flag raised.',
      createdAt: new Date(now.getTime() - 11 * 3600 * 1000), // 11 hours ago
      reviewedAt: null,
    },
  });
  console.log('[Seed] Created Pending Duplicate Moderation Review: Jute Floor Rug vs Jute Wall Hanging (100%)');;

  // 5. HISTORICAL APPROVED REVIEW: Verified authentic variation
  await prisma.moderationReview.create({
    data: {
      sourceArtworkId: scarfPiece.id,
      suspectedMatchId: sonargaonJamdani.id,
      similarityScore: 82.1,
      adminId: adminUser.id,
      actionTaken: 'APPROVED',
      adminNotes: 'Authentic pit-loom motif variation verified by Bengal Heritage Guild curator.',
      createdAt: new Date(now.getTime() - 26 * 3600 * 1000),
      reviewedAt: new Date(now.getTime() - 24 * 3600 * 1000),
    },
  });
  console.log('[Seed] Created History Approved Moderation Review: Sonargaon Muslin Scarf vs Jamdani Saree (82.1%)');

  // 6. HISTORICAL REJECTED REVIEW: Intercepted duplicate upload
  await prisma.moderationReview.create({
    data: {
      sourceArtworkId: miniatureTrio.id,
      suspectedMatchId: terracottaHorse.id,
      similarityScore: 94.7,
      adminId: adminUser.id,
      actionTaken: 'REJECTED',
      adminNotes: 'Duplicate listing attempt intercepted by perceptual dHash engine.',
      createdAt: new Date(now.getTime() - 50 * 3600 * 1000),
      reviewedAt: new Date(now.getTime() - 48 * 3600 * 1000),
    },
  });
  console.log('[Seed] Created History Rejected Moderation Review: Clay Horse Trio vs Terracotta Horse (94.7%)');

  // ---------------------------------------------------------------------------
  // 5. Seed Curated Exhibitions & Issued Ticket
  // ---------------------------------------------------------------------------
  const exhibitionsData = [
    {
      title: 'Bengal Threads & Looms: The Living Heritage of Jamdani',
      description: 'An immersive digital retrospective spotlighting the UNESCO-inscribed masterweavers of the Shitalakshya river basin and royal Mughal pit-loom traditions.',
      theme: 'Handloom Textiles & Royal Heritage',
      bannerUrl: HERITAGE_IMAGES.artworks.jamdaniSonargaon,
      ticketPrice: 75.0,
      startTime: oneDayAgo,
      endTime: fiveDaysAhead,
      vipStartTime: new Date(now.getTime() - 36 * 3600 * 1000),
      organizerId: organizerNaveed.id,
      artworks: [sonargaonJamdani.id, artworkMap.get('Nilambari Midnight-Indigo Jamdani Saree').id, tealJamdani.id],
    },
    {
      title: 'Sacred Soil: Terracotta Architecture of Ancient Bengal',
      description: 'A virtual walk through Kantaji Temple terracotta friezes, Paharpur Buddhist Vihara relief art, and historic burnt-clay iconography.',
      bannerUrl: HERITAGE_IMAGES.artworks.terracottaTemplePlaque,
      ticketPrice: 90.0,
      startTime: new Date(now.getTime() + 12 * 3600 * 1000),
      endTime: new Date(now.getTime() + 6 * 24 * 3600 * 1000),
      vipStartTime: oneDayAgo, // Currently in VIP Preview window!
      organizerId: organizerAnisur.id,
      artworks: [terracottaPlaque.id, terracottaHorse.id, artworkMap.get('Carved Red Clay Water Pitcher (Kolshi)').id],
    },
    {
      title: 'Lost-Wax & Bell Metal: The Metalcraft of Dhamrai',
      description: 'Showcasing the rare 500-year artisanal traditions of bell-metal casting, deepam peacocks, and temple gongs from Dhamrai.',
      bannerUrl: HERITAGE_IMAGES.artworks.brassPeacockLamp,
      ticketPrice: 60.0,
      startTime: twoDaysAhead,
      endTime: new Date(now.getTime() + 7 * 24 * 3600 * 1000),
      vipStartTime: new Date(now.getTime() + 24 * 3600 * 1000),
      organizerId: organizerNaveed.id,
      artworks: [brassLamp.id, artworkMap.get('Hand-Chiseled Kansa Bell-Metal Ritual Thali').id],
    },
    {
      title: 'Golden Fiber & Bamboo: Vernacular Craft Traditions',
      description: 'Concluded exhibition celebrating rural women artisans weaving Shital Pati cane mats, golden jute tapestries, and bamboo light fixtures.',
      bannerUrl: HERITAGE_IMAGES.artworks.shitalPatiMat,
      ticketPrice: 50.0,
      startTime: fiveDaysAgo,
      endTime: oneDayAgo,
      vipStartTime: new Date(now.getTime() - 6 * 24 * 3600 * 1000),
      organizerId: organizerAnisur.id,
      artworks: [artworkMap.get('Sylhet Murta Cane Diamond Weave Shital Pati').id, bambooLamp.id, artworkMap.get('Golden Fiber Braided Jute Wall Hanging').id],
    },
  ];

  for (const exh of exhibitionsData) {
    const existing = await prisma.exhibition.findFirst({
      where: { title: exh.title, organizerId: exh.organizerId },
    });

    let createdExh: any;
    if (existing) {
      createdExh = await prisma.exhibition.update({
        where: { id: existing.id },
        data: {
          description: exh.description,
          bannerUrl: exh.bannerUrl,
          ticketPrice: exh.ticketPrice,
          startTime: exh.startTime,
          endTime: exh.endTime,
          vipStartTime: exh.vipStartTime,
        },
      });
      console.log(`[Seed] Updated exhibition: "${exh.title}"`);
    } else {
      createdExh = await prisma.exhibition.create({
        data: {
          title: exh.title,
          description: exh.description,
          bannerUrl: exh.bannerUrl,
          ticketPrice: exh.ticketPrice,
          startTime: exh.startTime,
          endTime: exh.endTime,
          vipStartTime: exh.vipStartTime,
          organizerId: exh.organizerId,
        },
      });
      console.log(`[Seed] Created exhibition: "${exh.title}"`);
    }

    // Link exhibition artworks
    for (let i = 0; i < exh.artworks.length; i++) {
      const artId = exh.artworks[i];
      const linkExists = await prisma.exhibitionArtwork.findUnique({
        where: {
          exhibitionId_artworkId: {
            exhibitionId: createdExh.id,
            artworkId: artId,
          },
        },
      });
      if (!linkExists) {
        await prisma.exhibitionArtwork.create({
          data: {
            exhibitionId: createdExh.id,
            artworkId: artId,
            wallPosition: i + 1,
            posX: (i + 1) * 3.5,
            posY: 1.8,
          },
        });
      }
    }

    // Pre-issue a VIP admission ticket for Buyer Tanvir on the Sacred Soil exhibition
    if (exh.title.includes('Sacred Soil')) {
      const ticketToken = 'NK-EXH-2026-T7K2';
      const existingTicket = await prisma.exhibitionTicket.findUnique({
        where: { ticketToken },
      });
      if (!existingTicket) {
        await prisma.exhibitionTicket.create({
          data: {
            ticketToken,
            exhibitionId: createdExh.id,
            buyerId: buyerTanvir.id,
            isVip: true,
            purchasedAt: oneDayAgo,
          },
        });
        console.log(`[Seed] Issued VIP Exhibition Admission Ticket: ${ticketToken}`);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // 6. Seed Community Comments
  // ---------------------------------------------------------------------------
  const gramKantha = artworkMap.get('Gram Bangla Heirloom Nakshi Kantha');
  if (gramKantha) {
    const existingComment = await prisma.artworkComment.findFirst({
      where: { artworkId: gramKantha.id, userId: buyerTanvir.id },
    });
    if (!existingComment) {
      await prisma.artworkComment.create({
        data: {
          artworkId: gramKantha.id,
          userId: buyerTanvir.id,
          content: 'The running kantha stitchwork along the riverine boat border is masterwork quality. Truly an heirloom piece of rural folk artistry.',
        },
      });
      await prisma.artworkComment.create({
        data: {
          artworkId: gramKantha.id,
          userId: buyerSadia.id,
          content: 'Reminds me of my grandmother’s heirloom quilts from Jessore. Spectacular preservation of our cultural motifs!',
        },
      });
      console.log('[Seed] Added authentic community comments to Gram Bangla Kantha');
    }
  }

  console.log('[Seed] Production-grade seeding completed successfully with 100% authentic Bengali heritage assets!');
}

main()
  .catch((e) => {
    console.error('[Seed] Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
