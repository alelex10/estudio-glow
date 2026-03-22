import { products } from "../../models/relations";
import type { NewProduct } from "../../models/relations";

// Tipo helper para definir productos sin categoryId (se asigna dinámicamente)
type ProductSeed = Omit<NewProduct, "id" | "categoryId"> & { categoryName: string };

// Datos de productos organizados por categoría
export const productsData: ProductSeed[] = [
  // Skincare
  {
    name: "Limpiador Facial Suave",
    description: "Limpiador facial suave para uso diario. Elimina impurezas sin resecar la piel.",
    price: 1899,
    stock: 25,
    imageUrl: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400",
    categoryName: "Skincare",
  },
  {
    name: "Serum de Vitamina C",
    description: "Serum concentrado con vitamina C para iluminar y unificar el tono de la piel.",
    price: 4599,
    stock: 18,
    imageUrl: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400",
    categoryName: "Skincare",
  },
  {
    name: "Hidratante Facial con Ácido Hialurónico",
    description: "Crema hidratante ligera con ácido hialurónico para una piel plump y radiante.",
    price: 3299,
    stock: 30,
    imageUrl: "https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?w=400",
    categoryName: "Skincare",
  },
  {
    name: "Protector Solar SPF 50",
    description: "Protector solar facial de amplio espectro SPF 50. Textura ligera, no grasa.",
    price: 2799,
    stock: 40,
    imageUrl: "https://images.unsplash.com/photo-1556227834-09f1de7a7d14?w=400",
    categoryName: "Skincare",
  },
  {
    name: "Tónico Facial Calmante",
    description: "Tónico sin alcohol con extractos botánicos calmantes. Prepara la piel para el skincare.",
    price: 1599,
    stock: 22,
    imageUrl: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=400",
    categoryName: "Skincare",
  },

  // Maquillaje
  {
    name: "Base de Maquillaje Líquida",
    description: "Base líquida de cobertura media a alta. Acabado natural, larga duración.",
    price: 3899,
    stock: 15,
    imageUrl: "https://images.unsplash.com/photo-1631730486784-5456119f69ae?w=400",
    categoryName: "Maquillaje",
  },
  {
    name: "Paleta de Sombras Nude",
    description: "Paleta de 12 sombras en tonos nude. Mate y shimmer para looks de día y noche.",
    price: 5299,
    stock: 12,
    imageUrl: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400",
    categoryName: "Maquillaje",
  },
  {
    name: "Labial Matte Longwear",
    description: "Labial líquido matte de larga duración. No transfiere, acabado impecable.",
    price: 2199,
    stock: 35,
    imageUrl: "https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=400",
    categoryName: "Maquillaje",
  },
  {
    name: "Máscara de Pestañas Volumen",
    description: "Máscara de pestañas para volumen extremo. Fórmula resistente al agua.",
    price: 2499,
    stock: 28,
    imageUrl: "https://images.unsplash.com/photo-1631214503851-ae4d7d51f19f?w=400",
    categoryName: "Maquillaje",
  },
  {
    name: "Corrector Líquido Full Coverage",
    description: "Corrector de alta cobertura para ojeras e imperfecciones. No acumula en arrugas.",
    price: 1999,
    stock: 20,
    imageUrl: "https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?w=400",
    categoryName: "Maquillaje",
  },

  // Cabello
  {
    name: "Shampoo Hidratante",
    description: "Shampoo con aceite de argán para cabello seco y dañado. Limpia sin resecar.",
    price: 2299,
    stock: 30,
    imageUrl: "https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=400",
    categoryName: "Cabello",
  },
  {
    name: "Acondicionador Reparador",
    description: "Acondicionador intensivo con queratina para reparar puntas abiertas.",
    price: 2299,
    stock: 25,
    imageUrl: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400",
    categoryName: "Cabello",
  },
  {
    name: "Aceite de Argán Puro",
    description: "Aceite de argán 100% puro para hidratar y dar brillo al cabello.",
    price: 3499,
    stock: 18,
    imageUrl: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=400",
    categoryName: "Cabello",
  },
  {
    name: "Mascarilla Capilar Intensiva",
    description: "Mascarilla profunda para restaurar cabello extremadamente dañado.",
    price: 2899,
    stock: 15,
    imageUrl: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400",
    categoryName: "Cabello",
  },

  // Uñas
  {
    name: "Esmalte Gel Effect",
    description: "Esmalte con efecto gel. Brillo intenso, larga duración sin lámpara UV.",
    price: 1299,
    stock: 50,
    imageUrl: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400",
    categoryName: "Uñas",
  },
  {
    name: "Kit de Manicura Profesional",
    description: "Set completo con 7 herramientas esenciales para manicura en casa.",
    price: 3999,
    stock: 12,
    imageUrl: "https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=400",
    categoryName: "Uñas",
  },
  {
    name: "Base Fortalecedora",
    description: "Tratamiento base con biotina para fortalecer uñas débiles y quebradizas.",
    price: 1499,
    stock: 30,
    imageUrl: "https://images.unsplash.com/photo-1610992015732-2449b01cf3af?w=400",
    categoryName: "Uñas",
  },

  // Corporal
  {
    name: "Exfoliante Corporal",
    description: "Exfoliante con azúcar y aceites esenciales. Deja la piel suave y radiante.",
    price: 2599,
    stock: 20,
    imageUrl: "https://images.unsplash.com/photo-1608248597279-f99d160bfbc8?w=400",
    categoryName: "Corporal",
  },
  {
    name: "Crema Corporal Hidratante",
    description: "Crema corporal rica con manteca de karité. Hidratación 24 horas.",
    price: 2199,
    stock: 35,
    imageUrl: "https://images.unsplash.com/photo-1570194065650-d99fb4a38b9a?w=400",
    categoryName: "Corporal",
  },
  {
    name: "Aceite Corporal Seco",
    description: "Aceite seco multipropósito para cuerpo y rostro. Absorción rápida.",
    price: 3199,
    stock: 18,
    imageUrl: "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=400",
    categoryName: "Corporal",
  },

  // Accesorios
  {
    name: "Set de Brochas Profesionales",
    description: "Set de 10 brochas profesionales para aplicación perfecta de maquillaje.",
    price: 5999,
    stock: 15,
    imageUrl: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400",
    categoryName: "Accesorios",
  },
  {
    name: "Esponja Beauty Blender",
    description: "Esponja de maquillaje para aplicación impecable de base y corrector.",
    price: 1899,
    stock: 40,
    imageUrl: "https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?w=400",
    categoryName: "Accesorios",
  },
  {
    name: "Organizador de Maquillaje",
    description: "Organizador acrílico con múltiples compartimentos para cosméticos.",
    price: 4299,
    stock: 10,
    imageUrl: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400",
    categoryName: "Accesorios",
  },
];

// Función para insertar productos con IDs de categoría resueltos
export async function seedProducts(
  db: any,
  categoryMap: Map<string, string> // name -> id
) {
  console.log("🌱 Insertando productos...");

  // Mapear productos con sus categoryIds
  const productsToInsert = productsData.map((product) => {
    const categoryId = categoryMap.get(product.categoryName);
    if (!categoryId) {
      throw new Error(`Categoría no encontrada: ${product.categoryName}`);
    }

    return {
      name: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock,
      categoryId,
      imageUrl: product.imageUrl,
    };
  });

  const inserted = await db.insert(products).values(productsToInsert).returning();

  console.log(`✅ ${inserted.length} productos insertados`);

  return inserted;
}
