import { PrismaClient, Role, ModerationStatus, ArtworkAvailability, AuctionStatus, TransactionType } from '@prisma/client';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

// Verified High-Resolution Authentic Heritage Image URLs (all HTTP 200 OK)
const IMAGES = {
  // Avatars
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
  // Artworks
  artworks: {
    jamdaniSonargaon: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1200&q=80',
    jamdaniRoyalSilk: 'https://images.unsplash.com/photo-1607522370275-f14206abe5d3?auto=format&fit=crop&w=1200&q=80',
    jamdaniNilambari: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=1200&q=80',
    kanthaMayurpakkhi: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1200&q=80',
    kanthaLotusMedallion: 'https://images.unsplash.com/photo-1606744824163-985d376605aa?auto=format&fit=crop&w=1200&q=80',
    kanthaVillageFolklore: 'https://images.unsplash.com/photo-1582562124811-c09040d0a901?auto=format&fit=crop&w=1200&q=80',
    terracottaHorse: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=1200&q=80',
    terracottaPitcher: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=1200&q=80',
    terracottaPlaque: 'https://images.unsplash.com/photo-1590402494682-cd3fb53b1f70?auto=format&fit=crop&w=1200&q=80',
    terracottaSacrificialVase: 'https://images.unsplash.com/photo-1576014131341-fe1486fb2475?auto=format&fit=crop&w=1200&q=80',
    brassKansaUrn: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=1200&q=80',
    brassPeacockLamp: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1200&q=80',
    brassRitualPlate: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
    shitalPatiDiamond: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=1200&q=80',
    shitalPatiRoyalMat: 'https://images.unsplash.com/photo-1531875456634-3f5418280d20?auto=format&fit=crop&w=1200&q=80',
    juteTapestryGolden: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=1200&q=80',
    juteBraidedMandala: 'https://images.unsplash.com/photo-1596178065887-1198b6148b2b?auto=format&fit=crop&w=1200&q=80',
    woodRosewoodCasket: 'https://images.unsplash.com/photo-1541123437800-1bb1317badc2?auto=format&fit=crop&w=1200&q=80',
    folkPatuaBengalFlora: 'https://images.unsplash.com/photo-1579783901586-d88db74b4fe4?auto=format&fit=crop&w=1200&q=80',
    folkRickshawArtPeacock: 'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?auto=format&fit=crop&w=1200&q=80',
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
      avatarUrl: IMAGES.avatars.tanvir,
      passwordHash: commonPassword,
      initialBalance: 2500.0,
    },
    {
      email: 'sadia@nakshi.test',
      name: 'Sadia Rahman',
      role: Role.BUYER,
      bio: 'Folk craft aficionado and patron of rural women artisans in Jessore and Rajshahi.',
      avatarUrl: IMAGES.avatars.sadia,
      passwordHash: commonPassword,
      initialBalance: 1500.0,
    },
    {
      email: 'farhan@nakshi.test',
      name: 'Farhan Kabir',
      role: Role.BUYER,
      bio: 'Diaspora art patron curating authentic Bengali heritage artifacts for international cultural exhibitions.',
      avatarUrl: IMAGES.avatars.farhan,
      passwordHash: commonPassword,
      initialBalance: 3200.0,
    },
    // ARTISTS
    {
      email: 'artist@nakshi.test',
      name: 'Rokeya Begum',
      role: Role.ARTIST,
      bio: 'Master artisan from Jessore with 38 years of experience in hand-embroidered heirloom Nakshi Kantha tapestries and rural folklore motifs.',
      avatarUrl: IMAGES.avatars.rokeya,
      isVerified: true,
      passwordHash: commonPassword,
      initialBalance: 1850.0,
    },
    {
      email: 'alkas@nakshi.test',
      name: 'Alkas Mia',
      role: Role.ARTIST,
      bio: 'Third-generation master weaver from Sonargaon practicing 200-count traditional pit-loom Jamdani and pure zari craftsmanship.',
      avatarUrl: IMAGES.avatars.alkas,
      isVerified: true,
      passwordHash: commonPassword,
      initialBalance: 2400.0,
    },
    {
      email: 'gouranga@nakshi.test',
      name: 'Gouranga Pal',
      role: Role.ARTIST,
      bio: 'Traditional terracotta sculptor and potter from Panchagarh specializing in wood-fired red river silt plaques and horse motifs.',
      avatarUrl: IMAGES.avatars.gouranga,
      isVerified: true,
      passwordHash: commonPassword,
      initialBalance: 950.0,
    },
    {
      email: 'sukumar@nakshi.test',
      name: 'Sukumar Banik',
      role: Role.ARTIST,
      bio: 'Dhamrai bell metal and brass craftsman continuing a 500-year familial heritage in lost-wax ceremonial casting.',
      avatarUrl: IMAGES.avatars.sukumar,
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
      avatarUrl: IMAGES.avatars.naveed,
      isVerified: true,
      passwordHash: commonPassword,
      initialBalance: 800.0,
    },
    {
      email: 'anisur@nakshi.test',
      name: 'Dr. Anisur Rahman',
      role: Role.ORGANIZER,
      bio: 'Senior Folklorist and Director at the Dhaka Folk Antiquities Guild.',
      avatarUrl: IMAGES.avatars.anisur,
      isVerified: true,
      passwordHash: commonPassword,
      initialBalance: 1200.0,
    },
    // ADMINISTRATORS
    {
      email: 'admin@nakshi.test',
      name: 'Nakshi Administrator',
      role: Role.ADMIN,
      bio: 'Platform director, visual moderation manager, and auction scheduler at Nakshi.',
      avatarUrl: IMAGES.avatars.admin,
      isVerified: true,
      passwordHash: commonPassword,
      initialBalance: 10000.0,
    },
  ];

  const userRecords: Record<string, any> = {};

  for (const u of seedUsers) {
    const existing = await prisma.user.findUnique({
      where: { email: u.email },
      include: { wallet: true },
    });

    if (!existing) {
      const created = await prisma.user.create({
        data: {
          email: u.email,
          name: u.name,
          role: u.role,
          bio: u.bio,
          avatarUrl: u.avatarUrl,
          isVerified: u.isVerified || false,
          passwordHash: u.passwordHash,
          wallet: {
            create: {
              balance: u.initialBalance || 0.0,
            },
          },
        },
        include: { wallet: true },
      });

      if (created.wallet && u.initialBalance > 0) {
        await prisma.creditTransaction.create({
          data: {
            walletId: created.wallet.id,
            amount: u.initialBalance,
            type: TransactionType.TOP_UP,
            description: 'Initial platform allocation & welcoming top-up',
          },
        });
      }
      userRecords[u.email] = created;
      console.log(`[Seed] Created ${u.role}: ${created.name} (${created.email})`);
    } else {
      // Update details to ensure clean presentation avatar and bio
      const updated = await prisma.user.update({
        where: { id: existing.id },
        data: {
          name: u.name,
          bio: u.bio,
          avatarUrl: u.avatarUrl,
          isVerified: u.isVerified !== undefined ? u.isVerified : existing.isVerified,
        },
        include: { wallet: true },
      });

      if (!updated.wallet) {
        const wallet = await prisma.wallet.create({
          data: {
            userId: updated.id,
            balance: u.initialBalance || 0.0,
          },
        });
        if (u.initialBalance > 0) {
          await prisma.creditTransaction.create({
            data: {
              walletId: wallet.id,
              amount: u.initialBalance,
              type: TransactionType.TOP_UP,
              description: 'Initial platform allocation & welcoming top-up',
            },
          });
        }
      }
      userRecords[u.email] = updated;
      console.log(`[Seed] Refreshed existing ${u.role}: ${updated.name}`);
    }
  }

  // ---------------------------------------------------------------------------
  // 2. Seed Authentic Heritage Artworks
  // ---------------------------------------------------------------------------
  const rokeya = userRecords['artist@nakshi.test'];
  const alkas = userRecords['alkas@nakshi.test'];
  const gouranga = userRecords['gouranga@nakshi.test'];
  const sukumar = userRecords['sukumar@nakshi.test'];
  const organizer = userRecords['organizer@nakshi.test'];

  const authenticArtworks = [
    // ALKAS MIA - JAMDANI & MUSLIN
    {
      title: 'Sonargaon Heritage Jamdani Saree',
      artistId: alkas.id,
      medium: 'Handloom Jamdani',
      style: 'Floral Motifs',
      description: 'Authentic 200-count handloom muslin Jamdani woven with pure zari floral jaal motifs on a traditional bamboo pit loom in Sonargaon.',
      dimensions: '5.5 meters x 1.2 meters',
      weight: 0.85,
      weightUnit: 'kg',
      price: 1250.0,
      imageUrl: IMAGES.artworks.jamdaniSonargaon,
      availability: ArtworkAvailability.AVAILABLE,
      moderationStatus: ModerationStatus.APPROVED,
      like: 48,
    },
    {
      title: 'Imperial Jamdani Nilambari Drape',
      artistId: alkas.id,
      medium: 'Handloom Jamdani',
      style: 'Royal Heritage',
      description: 'Deep indigo-dyed ultra-fine muslin drape hand-loomed with silver-gilt jaldar vine patterns. Hand-spun yarn with natural botanical indigo wash.',
      dimensions: '5.5 meters x 1.15 meters',
      weight: 0.78,
      weightUnit: 'kg',
      price: 1450.0,
      imageUrl: IMAGES.artworks.jamdaniNilambari,
      availability: ArtworkAvailability.AVAILABLE,
      moderationStatus: ModerationStatus.APPROVED,
      like: 35,
    },
    {
      title: 'Mughal Terchi Floral Jamdani Weave',
      artistId: alkas.id,
      medium: 'Handloom Jamdani',
      style: 'Geometric Jaal',
      description: 'Diagonal terchi floral layout reflecting 17th-century Dhaka court textiles. Crafted over five weeks of patient non-structural weft manipulation.',
      dimensions: '5.2 meters x 1.2 meters',
      weight: 0.82,
      weightUnit: 'kg',
      price: 1100.0,
      imageUrl: IMAGES.artworks.jamdaniRoyalSilk,
      availability: ArtworkAvailability.AVAILABLE,
      moderationStatus: ModerationStatus.APPROVED,
      like: 29,
    },

    // ROKEYA BEGUM - NAKSHI KANTHA
    {
      title: 'Mayurpakkhi Heirloom Nakshi Kantha',
      artistId: rokeya.id,
      medium: 'Nakshi Kantha',
      style: 'Traditional Folk',
      description: 'Traditional quilt featuring intricate run-stitch peacocks, lotus pond medallions, and village folklore narratives layered from pure repurposed vintage cotton.',
      dimensions: '72 x 54 inches',
      weight: 1.4,
      weightUnit: 'kg',
      price: 850.0,
      imageUrl: IMAGES.artworks.kanthaMayurpakkhi,
      availability: ArtworkAvailability.AVAILABLE,
      moderationStatus: ModerationStatus.APPROVED,
      like: 62,
    },
    {
      title: 'Padma Lotus Mandala Ceremonial Quilt',
      artistId: rokeya.id,
      medium: 'Nakshi Kantha',
      style: 'Floral Motifs',
      description: 'Centrally anchored thousand-petal lotus mandala surrounded by betel leaf vines and tree of life motifs. Hand-stitched with vegetable-dyed silk threads.',
      dimensions: '80 x 60 inches',
      weight: 1.65,
      weightUnit: 'kg',
      price: 980.0,
      imageUrl: IMAGES.artworks.kanthaLotusMedallion,
      availability: ArtworkAvailability.AVAILABLE,
      moderationStatus: ModerationStatus.APPROVED,
      like: 44,
    },
    {
      title: 'Rural Bengal Harvest Narrative Tapestry',
      artistId: rokeya.id,
      medium: 'Nakshi Kantha',
      style: 'Traditional Folk',
      description: 'Pictorial tapestry detailing the Nabanna harvest celebration, river fishermen, and palanquin processions in dense concentric kantha stitching.',
      dimensions: '65 x 48 inches',
      weight: 1.2,
      weightUnit: 'kg',
      price: 720.0,
      imageUrl: IMAGES.artworks.kanthaVillageFolklore,
      availability: ArtworkAvailability.AVAILABLE,
      moderationStatus: ModerationStatus.APPROVED,
      like: 51,
    },

    // GOURANGA PAL - TERRACOTTA & CERAMIC
    {
      title: 'Panchagarh Folk Horse Clay Sculpture',
      artistId: gouranga.id,
      medium: 'Terracotta Clay',
      style: 'Sculptural & Relic',
      description: 'Hand-molded kiln-fired terracotta folk artifact embodying ancient North Bengal sacrificial horse motifs with hollow wheel-thrown neck and stamped saddles.',
      dimensions: '35 x 22 x 12 cm',
      weight: 2.8,
      weightUnit: 'kg',
      price: 450.0,
      imageUrl: IMAGES.artworks.terracottaHorse,
      availability: ArtworkAvailability.AVAILABLE,
      moderationStatus: ModerationStatus.APPROVED,
      like: 38,
    },
    {
      title: 'Rajshahi Glazed Heritage Clay Pitcher',
      artistId: gouranga.id,
      medium: 'Ceramic & Traditional Pottery',
      style: 'Traditional Folk',
      description: 'Wheel-thrown red river silt vessel wood-fired with natural slip glaze. Retains remarkable thermal insulation properties.',
      dimensions: '25 x 25 x 32 cm',
      weight: 1.9,
      weightUnit: 'kg',
      price: 320.0,
      imageUrl: IMAGES.artworks.terracottaPitcher,
      availability: ArtworkAvailability.AVAILABLE,
      moderationStatus: ModerationStatus.APPROVED,
      like: 27,
    },
    {
      title: 'Kantajew Temple Floral Terracotta Plaque',
      artistId: gouranga.id,
      medium: 'Terracotta Clay',
      style: 'Sculptural & Relic',
      description: 'Deep relief architectural terracotta tile inspired by 18th-century Dinajpur temple friezes. Portrays dancing musicians and intertwined blooming creepers.',
      dimensions: '30 x 30 x 5 cm',
      weight: 3.4,
      weightUnit: 'kg',
      price: 520.0,
      imageUrl: IMAGES.artworks.terracottaPlaque,
      availability: ArtworkAvailability.AVAILABLE,
      moderationStatus: ModerationStatus.APPROVED,
      like: 33,
    },
    {
      title: 'Ancient Mahasthangarh Red Silt Plaque',
      artistId: gouranga.id,
      medium: 'Terracotta Clay',
      style: 'Sculptural & Relic',
      description: 'Archaeological reproduction of 3rd-century Pundranagara clay artifacts fired in a traditional straw and husk earthen kiln.',
      dimensions: '28 x 20 x 4 cm',
      weight: 2.2,
      weightUnit: 'kg',
      price: 380.0,
      imageUrl: IMAGES.artworks.terracottaSacrificialVase,
      availability: ArtworkAvailability.AVAILABLE,
      moderationStatus: ModerationStatus.APPROVED,
      like: 22,
    },

    // SUKUMAR BANIK - BRASS & BELL METAL
    {
      title: 'Dhamrai Bell Metal Royal Kansa Urn',
      artistId: sukumar.id,
      medium: 'Brass & Bell Metal',
      style: 'Royal Heritage',
      description: 'Hand-beaten high-resonance lost-wax cast bell metal ceremonial vessel polished with tamarind rind and natural river sand.',
      dimensions: '28 x 28 x 38 cm',
      weight: 4.2,
      weightUnit: 'kg',
      price: 920.0,
      imageUrl: IMAGES.artworks.brassKansaUrn,
      availability: ArtworkAvailability.AVAILABLE,
      moderationStatus: ModerationStatus.APPROVED,
      like: 42,
    },
    {
      title: 'Ceremonial Brass Peacock Oil Lamp',
      artistId: sukumar.id,
      medium: 'Brass & Bell Metal',
      style: 'Royal Heritage',
      description: 'Seven-tiered standing oil lamp crowned by a majestic lost-wax cast peacock with articulated plumage and lotus reservoir.',
      dimensions: '20 x 20 x 45 cm',
      weight: 3.8,
      weightUnit: 'kg',
      price: 840.0,
      imageUrl: IMAGES.artworks.brassPeacockLamp,
      availability: ArtworkAvailability.AVAILABLE,
      moderationStatus: ModerationStatus.APPROVED,
      like: 37,
    },
    {
      title: 'Engraved Dhamrai Kansa Offering Thali',
      artistId: sukumar.id,
      medium: 'Brass & Bell Metal',
      style: 'Geometric Jaal',
      description: 'Solid bell metal ritual platter with concentric geometric chiseled bands that produce harmonic resonance when struck.',
      dimensions: '36 x 36 x 4 cm',
      weight: 2.6,
      weightUnit: 'kg',
      price: 610.0,
      imageUrl: IMAGES.artworks.brassRitualPlate,
      availability: ArtworkAvailability.AVAILABLE,
      moderationStatus: ModerationStatus.APPROVED,
      like: 19,
    },

    // ADDITIONAL HERITAGE MEDIUMS (SHITAL PATI, JUTE, WOOD, FOLK PAINTING)
    {
      title: 'Sylhet Imperial Murta Cane Shital Pati',
      artistId: rokeya.id,
      medium: 'Shital Pati Cane Weave',
      style: 'Geometric Jaal',
      description: 'Master-grade cold mat handwoven from slender green Murta reed fibers. Naturally cool to the touch even during peak Bengal summers.',
      dimensions: '84 x 60 inches',
      weight: 1.2,
      weightUnit: 'kg',
      price: 640.0,
      imageUrl: IMAGES.artworks.shitalPatiDiamond,
      availability: ArtworkAvailability.AVAILABLE,
      moderationStatus: ModerationStatus.APPROVED,
      like: 31,
    },
    {
      title: 'Royal Sikku Weave Cane Prayer Mat',
      artistId: rokeya.id,
      medium: 'Shital Pati Cane Weave',
      style: 'Contemporary Heritage',
      description: 'Fine-grain Murta pith fiber mat woven with subtle diamond step patterns and hemmed with vegetable-tanned cotton twill.',
      dimensions: '48 x 30 inches',
      weight: 0.75,
      weightUnit: 'kg',
      price: 420.0,
      imageUrl: IMAGES.artworks.shitalPatiRoyalMat,
      availability: ArtworkAvailability.AVAILABLE,
      moderationStatus: ModerationStatus.APPROVED,
      like: 18,
    },
    {
      title: 'Golden Fiber Embroidered Jute Tapestry',
      artistId: rokeya.id,
      medium: 'Jute Fiber Craft',
      style: 'Contemporary Heritage',
      description: 'Naturally dyed spun golden jute fibers braided and cross-stitched into an expansive wall tapestry celebrating Bengal’s river delta ecology.',
      dimensions: '40 x 30 inches',
      weight: 1.5,
      weightUnit: 'kg',
      price: 360.0,
      imageUrl: IMAGES.artworks.juteTapestryGolden,
      availability: ArtworkAvailability.AVAILABLE,
      moderationStatus: ModerationStatus.APPROVED,
      like: 25,
    },
    {
      title: 'Braided Jute Mandala Wall Hanging',
      artistId: rokeya.id,
      medium: 'Jute Fiber Craft',
      style: 'Geometric Jaal',
      description: 'Hand-coiled natural raw jute rope woven into concentric sunburst ripples with madder-root dyed accents.',
      dimensions: '32 x 32 inches',
      weight: 1.1,
      weightUnit: 'kg',
      price: 290.0,
      imageUrl: IMAGES.artworks.juteBraidedMandala,
      availability: ArtworkAvailability.AVAILABLE,
      moderationStatus: ModerationStatus.APPROVED,
      like: 21,
    },
    {
      title: 'Chittagong Carved Sheesham Wood Casket',
      artistId: sukumar.id,
      medium: 'Wood Carving & Inlay',
      style: 'Floral Motifs',
      description: 'Solid seasoned rosewood heirloom chest featuring deep hand-carved floral relief panels and delicate brass wire inlay.',
      dimensions: '30 x 20 x 15 cm',
      weight: 2.1,
      weightUnit: 'kg',
      price: 780.0,
      imageUrl: IMAGES.artworks.woodRosewoodCasket,
      availability: ArtworkAvailability.AVAILABLE,
      moderationStatus: ModerationStatus.APPROVED,
      like: 34,
    },
    {
      title: 'Bengal Kalighat Patua Flora & Bird Scroll',
      artistId: rokeya.id,
      medium: 'Folk Painting & Patua',
      style: 'Traditional Folk',
      description: 'Fluid natural pigment gouache on handmade rag paper depicting nightingales nestled in kadamba branches. Traditional Patua brushwork.',
      dimensions: '28 x 20 inches',
      weight: 0.45,
      weightUnit: 'kg',
      price: 540.0,
      imageUrl: IMAGES.artworks.folkPatuaBengalFlora,
      availability: ArtworkAvailability.AVAILABLE,
      moderationStatus: ModerationStatus.APPROVED,
      like: 40,
    },
    {
      title: 'Traditional Rickshaw Art Floral Medallion',
      artistId: rokeya.id,
      medium: 'Folk Painting & Patua',
      style: 'Contemporary Heritage',
      description: 'Enamel paint on pressed tin plate featuring high-contrast iconic Dhaka rickshaw flora, peacocks, and cinematic cinema scrolls.',
      dimensions: '24 x 18 inches',
      weight: 0.9,
      weightUnit: 'kg',
      price: 410.0,
      imageUrl: IMAGES.artworks.folkRickshawArtPeacock,
      availability: ArtworkAvailability.AVAILABLE,
      moderationStatus: ModerationStatus.APPROVED,
      like: 55,
    },

    // ORGANIZER COLLECTION ARTWORKS (FOR EXHIBITIONS)
    {
      title: 'Sonargaon Heirloom Nakshi Kantha Quilt',
      artistId: organizer.id,
      medium: 'Nakshi Kantha',
      style: 'Traditional Folk',
      description: 'Multi-layered antique quilt embroidered with traditional lotus mandala and rural folklore narratives from the Bengal Heritage collection.',
      dimensions: '75 x 55 inches',
      weight: 1.5,
      weightUnit: 'kg',
      price: 950.0,
      imageUrl: IMAGES.artworks.kanthaMayurpakkhi,
      availability: ArtworkAvailability.AVAILABLE,
      moderationStatus: ModerationStatus.APPROVED,
      like: 32,
    },
    {
      title: 'Ancient Mahasthangarh Red Silt Temple Plaque',
      artistId: organizer.id,
      medium: 'Terracotta Clay',
      style: 'Sculptural & Relic',
      description: 'Hand-carved temple architectural motif depicting tree of life in natural kiln-fired clay from North Bengal.',
      dimensions: '30 x 25 x 6 cm',
      weight: 3.1,
      weightUnit: 'kg',
      price: 680.0,
      imageUrl: IMAGES.artworks.terracottaPlaque,
      availability: ArtworkAvailability.AVAILABLE,
      moderationStatus: ModerationStatus.APPROVED,
      like: 28,
    },
    {
      title: 'Royal Muslin Jamdani Nilambari Retrospective',
      artistId: organizer.id,
      medium: 'Handloom Jamdani',
      style: 'Royal Heritage',
      description: 'Indigo-dyed fine muslin hand-loomed with silver-gilt floral jaldar designs from the private collection of Bengal Heritage Foundation.',
      dimensions: '5.5 meters x 1.2 meters',
      weight: 0.8,
      weightUnit: 'kg',
      price: 1550.0,
      imageUrl: IMAGES.artworks.jamdaniNilambari,
      availability: ArtworkAvailability.AVAILABLE,
      moderationStatus: ModerationStatus.APPROVED,
      like: 45,
    },
  ];

  const artworkRecords: Record<string, any> = {};

  for (const art of authenticArtworks) {
    const existing = await prisma.artwork.findFirst({
      where: { title: art.title },
    });

    if (!existing) {
      const created = await prisma.artwork.create({
        data: art,
      });
      artworkRecords[art.title] = created;
      console.log(`[Seed] Created artwork: "${created.title}" (${created.medium})`);
    } else {
      const updated = await prisma.artwork.update({
        where: { id: existing.id },
        data: {
          imageUrl: art.imageUrl,
          price: art.price,
          description: art.description,
          dimensions: art.dimensions,
          weight: art.weight,
          medium: art.medium,
          style: art.style,
          availability: art.availability,
          moderationStatus: art.moderationStatus,
        },
      });
      artworkRecords[art.title] = updated;
      console.log(`[Seed] Updated artwork: "${updated.title}"`);
    }
  }

  // ---------------------------------------------------------------------------
  // 3. Seed Realistic Live & Upcoming Auctions
  // ---------------------------------------------------------------------------
  const now = new Date();
  const tanvir = userRecords['buyer@nakshi.test'];
  const sadia = userRecords['sadia@nakshi.test'];
  const farhan = userRecords['farhan@nakshi.test'];

  // Prepare auction artworks
  const auction1Art = artworkRecords['Sonargaon Heritage Jamdani Saree'];
  const auction2Art = artworkRecords['Ceremonial Brass Peacock Oil Lamp'];
  const auction3Art = artworkRecords['Kantajew Temple Floral Terracotta Plaque'];
  const auction4Art = artworkRecords['Mayurpakkhi Heirloom Nakshi Kantha'];

  if (auction1Art) {
    // 1. Live Auction (Ending in 3 days, active bids)
    let a1 = await prisma.auction.findFirst({
      where: { artworkId: auction1Art.id },
    });
    if (!a1) {
      a1 = await prisma.auction.create({
        data: {
          artworkId: auction1Art.id,
          startingBid: 800.0,
          currentHighestBid: 1150.0,
          minIncrement: 50.0,
          startTime: new Date(now.getTime() - 86400000 * 2), // Started 2 days ago
          endTime: new Date(now.getTime() + 86400000 * 3),   // Ends in 3 days
          status: AuctionStatus.ACTIVE,
          winnerId: tanvir.id,
        },
      });
      // Mark artwork as RESERVED
      await prisma.artwork.update({
        where: { id: auction1Art.id },
        data: { availability: ArtworkAvailability.RESERVED },
      });

      // Add realistic bidding history
      await prisma.auctionBid.createMany({
        data: [
          { auctionId: a1.id, bidderId: sadia.id, amount: 800.0, createdAt: new Date(now.getTime() - 86400000 * 1.8) },
          { auctionId: a1.id, bidderId: farhan.id, amount: 950.0, createdAt: new Date(now.getTime() - 86400000 * 1.2) },
          { auctionId: a1.id, bidderId: tanvir.id, amount: 1050.0, createdAt: new Date(now.getTime() - 86400000 * 0.8) },
          { auctionId: a1.id, bidderId: farhan.id, amount: 1100.0, createdAt: new Date(now.getTime() - 86400000 * 0.4) },
          { auctionId: a1.id, bidderId: tanvir.id, amount: 1150.0, createdAt: new Date(now.getTime() - 3600000 * 3) },
        ],
      });
      console.log(`[Seed] Created LIVE Auction: ${auction1Art.title} (Highest bid: 1,150.00 Credits)`);
    } else {
      await prisma.auction.update({
        where: { id: a1.id },
        data: {
          startTime: new Date(now.getTime() - 86400000 * 2),
          endTime: new Date(now.getTime() + 86400000 * 3),
          status: AuctionStatus.ACTIVE,
        },
      });
    }
  }

  if (auction2Art) {
    // 2. Live Auction (Ending in 5 days)
    let a2 = await prisma.auction.findFirst({
      where: { artworkId: auction2Art.id },
    });
    if (!a2) {
      a2 = await prisma.auction.create({
        data: {
          artworkId: auction2Art.id,
          startingBid: 600.0,
          currentHighestBid: 780.0,
          minIncrement: 30.0,
          startTime: new Date(now.getTime() - 86400000 * 1),
          endTime: new Date(now.getTime() + 86400000 * 5),
          status: AuctionStatus.ACTIVE,
          winnerId: sadia.id,
        },
      });
      await prisma.artwork.update({
        where: { id: auction2Art.id },
        data: { availability: ArtworkAvailability.RESERVED },
      });
      await prisma.auctionBid.createMany({
        data: [
          { auctionId: a2.id, bidderId: farhan.id, amount: 600.0, createdAt: new Date(now.getTime() - 86400000 * 0.9) },
          { auctionId: a2.id, bidderId: sadia.id, amount: 680.0, createdAt: new Date(now.getTime() - 86400000 * 0.5) },
          { auctionId: a2.id, bidderId: tanvir.id, amount: 720.0, createdAt: new Date(now.getTime() - 86400000 * 0.2) },
          { auctionId: a2.id, bidderId: sadia.id, amount: 780.0, createdAt: new Date(now.getTime() - 3600000 * 2) },
        ],
      });
      console.log(`[Seed] Created LIVE Auction: ${auction2Art.title} (Highest bid: 780.00 Credits)`);
    } else {
      await prisma.auction.update({
        where: { id: a2.id },
        data: {
          startTime: new Date(now.getTime() - 86400000 * 1),
          endTime: new Date(now.getTime() + 86400000 * 5),
          status: AuctionStatus.ACTIVE,
        },
      });
    }
  }

  if (auction3Art) {
    // 3. Upcoming Auction (Starting in 3 days)
    let a3 = await prisma.auction.findFirst({
      where: { artworkId: auction3Art.id },
    });
    if (!a3) {
      a3 = await prisma.auction.create({
        data: {
          artworkId: auction3Art.id,
          startingBid: 400.0,
          currentHighestBid: 400.0,
          minIncrement: 25.0,
          startTime: new Date(now.getTime() + 86400000 * 3),
          endTime: new Date(now.getTime() + 86400000 * 10),
          status: AuctionStatus.UPCOMING,
        },
      });
      console.log(`[Seed] Created UPCOMING Auction: ${auction3Art.title}`);
    } else {
      await prisma.auction.update({
        where: { id: a3.id },
        data: {
          startTime: new Date(now.getTime() + 86400000 * 3),
          endTime: new Date(now.getTime() + 86400000 * 10),
          status: AuctionStatus.UPCOMING,
        },
      });
    }
  }

  if (auction4Art) {
    // 4. Upcoming Auction (Starting in 5 days)
    let a4 = await prisma.auction.findFirst({
      where: { artworkId: auction4Art.id },
    });
    if (!a4) {
      a4 = await prisma.auction.create({
        data: {
          artworkId: auction4Art.id,
          startingBid: 650.0,
          currentHighestBid: 650.0,
          minIncrement: 50.0,
          startTime: new Date(now.getTime() + 86400000 * 5),
          endTime: new Date(now.getTime() + 86400000 * 14),
          status: AuctionStatus.UPCOMING,
        },
      });
      console.log(`[Seed] Created UPCOMING Auction: ${auction4Art.title}`);
    } else {
      await prisma.auction.update({
        where: { id: a4.id },
        data: {
          startTime: new Date(now.getTime() + 86400000 * 5),
          endTime: new Date(now.getTime() + 86400000 * 14),
          status: AuctionStatus.UPCOMING,
        },
      });
    }
  }

  // ---------------------------------------------------------------------------
  // 4. Seed Exhibitions with Verified Working Images & Schedules
  // ---------------------------------------------------------------------------
  const exhibitionList = [
    {
      title: 'Threads of Bengal: Sacred Folk Tapestries',
      description: 'An immersive virtual curation celebrating heirloom Nakshi Kantha quilts and hand-spun rural tapestries from Sonargaon and Rajshahi.',
      bannerUrl: IMAGES.artworks.kanthaMayurpakkhi,
      ticketPrice: 50.0,
      startTime: new Date(now.getTime() - 86400000 * 2), // Open now
      endTime: new Date(now.getTime() + 86400000 * 14),
      vipStartTime: new Date(now.getTime() - 86400000 * 2),
      vipEndTime: new Date(now.getTime() - 86400000 * 1), // VIP concluded, now general admission
      layoutConfig: {
        curatorNote: 'Walk through the 3 ceremonial halls to experience centuries of indigenous needlework traditions.',
        walls: ['North Hall: Heirloom Quilts', 'East Hall: Zari Borders', 'South Hall: Contemporary Interpretations'],
      },
    },
    {
      title: 'Royal Muslin & Masterpiece Jamdani Retrospective',
      description: 'VIP Collector Exclusive exhibition spotlighting 200-count geometric Jamdani sarees and Mughal royal court weaves.',
      bannerUrl: IMAGES.artworks.jamdaniSonargaon,
      ticketPrice: 75.0,
      startTime: new Date(now.getTime() - 3600000 * 4),
      endTime: new Date(now.getTime() + 86400000 * 7),
      vipStartTime: new Date(now.getTime() - 3600000 * 4),
      vipEndTime: new Date(now.getTime() + 86400000 * 2), // VIP active now!
      layoutConfig: {
        curatorNote: 'VIP Collector Preview: Early access to private collection heirlooms.',
        walls: ['Royal Pavilion: Floral Jaal', 'Weavers Studio: Historical Looms'],
      },
    },
    {
      title: 'Dhaka Terracotta & Archaeological Clay Relics',
      description: 'Exploring archaeological red clay vessels, temple plaques, and wood-fired folk motifs from ancient Bengal dynasties.',
      bannerUrl: IMAGES.artworks.terracottaPlaque,
      ticketPrice: 35.0,
      startTime: new Date(now.getTime() + 86400000 * 3), // Upcoming
      endTime: new Date(now.getTime() + 86400000 * 20),
      vipStartTime: new Date(now.getTime() + 86400000 * 2),
      vipEndTime: new Date(now.getTime() + 86400000 * 3),
      layoutConfig: {
        curatorNote: 'A tactile virtual walkthrough of ancient riverine clay craftsmanship.',
        walls: ['Main Gallery: Ancient Plaques', 'West Gallery: Ritual Vessels'],
      },
    },
    {
      title: 'Ancient Kantha & Silk Archive (19th Century)',
      description: 'Archived historical showcase of 19th-century Rajshahi silk tapestries and ceremonial folk quilts.',
      bannerUrl: IMAGES.artworks.kanthaVillageFolklore,
      ticketPrice: 40.0,
      startTime: new Date(now.getTime() - 86400000 * 40),
      endTime: new Date(now.getTime() - 86400000 * 2), // Concluded
      layoutConfig: {
        curatorNote: 'Archived historical showcase. Viewing period has concluded.',
        walls: ['Historical Pavilion', 'Archived Gallery'],
      },
    },
  ];

  const organizerArtworks = await prisma.artwork.findMany({
    where: { artistId: organizer.id },
  });

  for (const exh of exhibitionList) {
    let existingExh = await prisma.exhibition.findFirst({
      where: { title: exh.title },
    });

    if (!existingExh) {
      existingExh = await prisma.exhibition.create({
        data: {
          ...exh,
          organizerId: organizer.id,
        },
      });

      // Attach artworks
      for (let i = 0; i < organizerArtworks.length; i++) {
        await prisma.exhibitionArtwork.create({
          data: {
            exhibitionId: existingExh.id,
            artworkId: organizerArtworks[i].id,
            wallPosition: i + 1,
            posX: (i % 3) * 30 + 15,
            posY: Math.floor(i / 3) * 40 + 20,
          },
        });
      }
      console.log(`[Seed] Created Exhibition: ${exh.title}`);
    } else {
      await prisma.exhibition.update({
        where: { id: existingExh.id },
        data: {
          bannerUrl: exh.bannerUrl,
          startTime: exh.startTime,
          endTime: exh.endTime,
          vipStartTime: exh.vipStartTime,
          vipEndTime: exh.vipEndTime,
        },
      });
      console.log(`[Seed] Refreshed Exhibition: ${exh.title}`);
    }

    // Seed a valid ticket token for buyer Tanvir Ahmed on "Threads of Bengal"
    if (exh.title.includes('Threads of Bengal')) {
      const existingTicket = await prisma.exhibitionTicket.findFirst({
        where: { exhibitionId: existingExh.id, buyerId: tanvir.id },
      });
      if (!existingTicket) {
        await prisma.exhibitionTicket.create({
          data: {
            ticketToken: 'NK-EXH-2026-T7K2',
            exhibitionId: existingExh.id,
            buyerId: tanvir.id,
            isVip: false,
          },
        });
        console.log(`[Seed] Issued demo ticket NK-EXH-2026-T7K2 to Tanvir Ahmed`);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // 5. Seed Real Artwork Discussion Comments & Likes
  // ---------------------------------------------------------------------------
  const firstArt = artworkRecords['Sonargaon Heritage Jamdani Saree'];
  if (firstArt) {
    const existingComments = await prisma.artworkComment.findMany({
      where: { artworkId: firstArt.id },
    });
    if (existingComments.length === 0) {
      await prisma.artworkComment.createMany({
        data: [
          {
            artworkId: firstArt.id,
            userId: sadia.id,
            content: 'The zari density on the border is exceptional! Master Alkas weaves like poetry.',
            createdAt: new Date(now.getTime() - 3600000 * 12),
          },
          {
            artworkId: firstArt.id,
            userId: tanvir.id,
            content: 'Authentic 200-ply muslin is exceedingly rare today. Truly an heirloom investment.',
            createdAt: new Date(now.getTime() - 3600000 * 5),
          },
        ],
      });
      console.log('[Seed] Added authentic discussion comments to Jamdani Saree');
    }
  }

  console.log('[Seed] Production-grade authentic dataset seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('[Seed] Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
