"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { PlusCircle, Upload, Image as ImageIcon } from "lucide-react";
import styles from "./InventoryForm.module.css";
import { useProducts } from "@/state/products";
import { useUi } from "@/state/ui";
import { addProduct, updateProduct, cloudinaryConfig } from "@/lib/api";
import type { Product, StockValue } from "@/lib/types";

type FormState = {
  id?: string;
  name: string;
  price: number;
  stock: StockValue;
  category: string;
  unit: string;
  consume: number;
  isCoffee: boolean;
  imageFile?: File | null;
  imageUrl?: string | null;
};

const emptyForm: FormState = {
  name: "",
  price: 0,
  stock: "",
  category: "",
  unit: "und",
  consume: 1,
  isCoffee: false,
  imageFile: null,
  imageUrl: null,
};

async function uploadToCloudinary(file?: File | null) {
  if (!file) return null;
  if (!cloudinaryConfig.url || !cloudinaryConfig.preset) {
    throw new Error("Falta configurar Cloudinary (url o preset)");
  }
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", cloudinaryConfig.preset);
  const res = await fetch(cloudinaryConfig.url, { method: "POST", body: formData });
  const data = await res.json();
  if (!res.ok) {
    const message =
      (data as any)?.error?.message ??
      (data as any)?.message ??
      "No se pudo subir la imagen";
    if (typeof message === "string" && message.toLowerCase().includes("preset")) {
      throw new Error("Cloudinary: upload_preset no encontrado. Verifica NEXT_PUBLIC_CLOUDINARY_PRESET.");
    }
    throw new Error(message);
  }
  if (!data.secure_url) {
    throw new Error("Cloudinary no devolvio una URL valida");
  }
  return data.secure_url as string;
}

type Props = {
  onSaved?: () => void;
  editing?: Product | null;
};

export function InventoryForm({ onSaved, editing }: Props) {
  const { categories, refresh, upsertLocal } = useProducts();
  const { showToast } = useUi();
  const [form, setForm] = useState<FormState>(() => ({
    ...emptyForm,
    category: categories[0]?.key ?? "",
  }));
  const [submitting, setSubmitting] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const isEdit = Boolean(editing?.id);

  useMemo(() => {
    if (editing) {
      setForm({
        id: editing.id,
        name: editing.name,
        price: editing.price,
        stock: editing.stock,
        category: editing.category,
        unit: editing.unit,
        consume: editing.consumePerSale ?? 1,
        isCoffee: Boolean(editing.isCoffee),
        imageFile: null,
        imageUrl: editing.image ?? null,
      });
      setPreview(editing.image ?? null);
    } else {
      setForm((prev) => ({
        ...emptyForm,
        category: categories[0]?.key ?? prev.category,
      }));
      setPreview(null);
    }
  }, [editing, categories]);

  const handleChange = (key: keyof FormState, value: FormState[keyof FormState]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleChange("imageFile", file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    if (!form.name) {
      showToast("Nombre es obligatorio");
      return;
    }
    const qty = (form.isCoffee || form.stock === "") ? "" : Number(form.stock);
    const payload = {
      name: form.name,
      price: Number(form.price),
      qty: qty as StockValue,
      cat: form.category,
      unit: form.unit,
      consume: Number(form.consume || 1),
      isCoffee: form.isCoffee,
      img: form.imageUrl,
    };
    try {
      setSubmitting(true);
      let imageUrl = form.imageUrl;
      if (form.imageFile) {
        imageUrl = await uploadToCloudinary(form.imageFile);
        // Guardamos la URL subida para que quede en el estado y la vista
        setForm((prev) => ({ ...prev, imageUrl }));
      }
      const productId = form.id ?? crypto.randomUUID();
      const localProduct: Product = {
        id: productId,
        name: form.name,
        price: Number(form.price),
        stock: qty,
        category: form.category,
        unit: form.unit,
        consumePerSale: Number(form.consume || 1),
        image: imageUrl ?? null,
        isCoffee: form.isCoffee,
      };
      if (isEdit && form.id) {
        await updateProduct({ ...payload, img: imageUrl, i: imageUrl, id: form.id });
        showToast("Inventario actualizado");
      } else {
        await addProduct({ ...payload, img: imageUrl, i: imageUrl });
        showToast("Guardado en Inventario");
      }
      upsertLocal(localProduct);
      await refresh();
      setForm({ ...emptyForm, category: categories[0]?.key ?? "" });
      setPreview(null);
      onSaved?.();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Error guardando");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3>{isEdit ? "EDITAR PRODUCTO" : "AGREGAR NUEVO PRODUCTO"}</h3>
      </div>

      <div className={styles.content}>
        {/* Lado Izquierdo: Image Uploader */}
        <div className={styles.imageSection}>
          <label className={styles.imageUpload}>
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleImageChange}
              className={styles.hiddenInput} 
            />
            {preview ? (
              <img src={preview} alt="Preview" className={styles.previewImage} />
            ) : (
              <div className={styles.uploadPlaceholder}>
                <ImageIcon size={32} />
                <span>Toca para subir imagen</span>
              </div>
            )}
            <div className={styles.overlay}>
              <Upload size={24} />
            </div>
          </label>
        </div>

        {/* Lado Derecho: Inputs */}
        <div className={styles.formFields}>
          {/* Fila 1: Nombre */}
          <div className={styles.row}>
            <div className={styles.groupFull}>
              <label className={styles.labelField}>Nombre del producto</label>
              <input
                className={styles.inputField}
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="PARA CALMAR EL FRÍO"
              />
            </div>
          </div>



          {/* Fila 2: Categoria */}
          <div className={styles.row}>
            <div className={styles.groupFull}>
              <label className={styles.labelField}>Categoria</label>
              <select
                className={styles.selectField}
                value={form.category}
                onChange={(e) => handleChange("category", e.target.value)}
              >
                {categories.map((cat) => (
                  <option key={cat.key} value={cat.key}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Fila 3: Precio, Stock */}
          <div className={styles.row}>
            <div className={styles.group}>
              <label className={styles.labelField}>Precio</label>
              <input
                className={styles.inputField}
                type="number"
                value={form.price || ""}
                onChange={(e) => handleChange("price", Number(e.target.value))}
                placeholder="$0"
              />
            </div>
            
            <div className={styles.groupStock}>
              <div className={styles.stockHeader}>
                <label className={styles.labelField}>Stock</label>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={form.isCoffee}
                    onChange={(e) => handleChange("isCoffee", e.target.checked)}
                  />
                  ¿Base Café?
                </label>
              </div>
              <input
                className={styles.inputField}
                type="number"
                value={form.stock === "" || form.stock === null ? "" : form.stock}
                onChange={(e) => handleChange("stock", e.target.value)}
                disabled={form.isCoffee}
                placeholder={form.isCoffee ? "Global" : "∞"}
              />
            </div>

          </div>

          {/* Fila 4: Unidad, Consumo */}
          <div className={styles.row}>
            <div className={styles.group}>
              <label className={styles.labelField}>Unidad de Medida</label>
              <select
                className={styles.selectField}
                value={form.unit || "und"}
                onChange={(e) => handleChange("unit", e.target.value)}
              >
                <option value="und">Unidad (und)</option>
                <option value="g">Gramos (g)</option>
                <option value="ml">Mililitros (ml)</option>
              </select>
            </div>
            <div className={styles.group}>
              <label className={styles.labelField}>Descuento por venta</label>
              <input
                className={styles.inputField}
                type="number"
                value={form.consume || ""}
                onChange={(e) => handleChange("consume", Number(e.target.value))}
                placeholder="Ej: 10"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Botón Principal */}
      <button 
        className={styles.submitBtn} 
        onClick={handleSubmit} 
        disabled={submitting}
      >
        <PlusCircle size={20} />
        {isEdit ? "Actualizar Producto" : "Guardar en Inventario"}
      </button>
    </div>
  );
}


