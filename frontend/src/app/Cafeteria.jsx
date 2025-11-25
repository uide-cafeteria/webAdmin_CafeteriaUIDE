import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Edit, Trash2, Plus, X, DollarSign, Tag, ImageIcon } from 'lucide-react'
import '../styles/cafeteria.css'

export default function Cafeteria({ onLogout }) {
  const navigate = useNavigate()
  const [products, setProducts] = useState([
    { id: 1, nombre: 'Café Americano', name: 'Café Americano', descripcion: 'Café negro, intenso y aromático.', precio: 2.50, price: 2.50, categoria: 'Desayuno', category: 'Desayuno', imagen: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&h=300&fit=crop', image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&h=300&fit=crop', ubicacion: 'cafeteria', creado_por: 1, activo: true },
    { id: 2, nombre: 'Sándwich de Pollo', name: 'Sándwich de Pollo', descripcion: 'Pan artesanal con pollo, lechuga y aderezo.', precio: 5.99, price: 5.99, categoria: 'Almuerzo', category: 'Almuerzo', imagen: 'https://images.unsplash.com/photo-1451685628346-21dec264bd3f?w=400&h=300&fit=crop', image: 'https://images.unsplash.com/photo-1451685628346-21dec264bd3f?w=400&h=300&fit=crop', ubicacion: 'ambos', creado_por: 1 },
    { id: 3, nombre: 'Jugo Natural', name: 'Jugo Natural', descripcion: 'Jugo recién exprimido de frutas de temporada.', precio: 3.50, price: 3.50, categoria: 'Desayuno', category: 'Desayuno', imagen: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400&h=300&fit=crop', image: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400&h=300&fit=crop', ubicacion: 'rooftop', creado_por: 1 },
    { id: 4, nombre: 'Ensalada César', name: 'Ensalada César', descripcion: 'Ensalada fresca con aderezo César y crutones.', precio: 6.50, price: 6.50, categoria: 'Almuerzo', category: 'Almuerzo', imagen: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop', ubicacion: 'cafeteria', creado_por: 1, activo: true }
  ])
  
  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    descripcion: '',
    price: '',
    categoria: 'Desayuno',
    category: 'Desayuno',
    image: '',
    imageBase64: '',
    activo: true,
    ubicacion: 'cafeteria',
    creado_por: 1
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitSuccess, setSubmitSuccess] = useState('')

  const handleLogout = async () => {
    const token = (() => {
      try { return localStorage.getItem('authToken') } catch (_) { return null }
    })()

    try {
      await fetch('http://172.16.65.217:3001/api/usuario/logout/admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({})
      })
    } catch (err) {
      // don't block logout on network error - just log
      // eslint-disable-next-line no-console
      console.error('Logout request failed', err)
    } finally {
      try { localStorage.removeItem('authToken') } catch (_) {}
      if (onLogout) onLogout()
      navigate('/login')
    }
  }

  const openModal = (product = null) => {
    if (product) {
      setEditingProduct(product)
      // compute imageBase64 if product has data URL or base64
      const imageVal = product.image || product.imagen || ''
      let base64 = ''
      let imgSrc = imageVal
      if (typeof imageVal === 'string' && imageVal.startsWith('data:')) {
        base64 = imageVal.split(',')[1] || ''
      } else if (typeof imageVal === 'string' && imageVal.length > 200) {
        // assume raw base64 text -> create a data url for preview
        base64 = imageVal
        imgSrc = `data:image/jpeg;base64,${base64}`
      }
      setFormData({ ...product, image: imgSrc, imageBase64: base64, activo: product.activo ?? true })
    } else {
      setEditingProduct(null)
      setFormData({ name: '', descripcion: '', price: '', categoria: 'Desayuno', category: 'Desayuno', image: '', imageBase64: '', ubicacion: 'cafeteria', creado_por: 1, activo: true })
    }
    setShowModal(true)
  }

  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const dataUrl = event.target.result
        // extract raw base64 portion if present
        const base64 = typeof dataUrl === 'string' && dataUrl.includes(',') ? dataUrl.split(',')[1] : ''
        setFormData({ ...formData, image: dataUrl, imageBase64: base64 })
      }
      reader.readAsDataURL(file)
    }
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingProduct(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitError('')
    setSubmitSuccess('')
    setSubmitting(true)

    // Prepare payload matching backend schema
    const payload = {
      nombre: formData.name,
      descripcion: formData.descripcion,
      precio: parseFloat(formData.price) || 0,
      // prefer raw base64 text for DB compatibility; fallback to image data-url or empty
      imagen: formData.imageBase64 || (typeof formData.image === 'string' ? formData.image : '') || '',
      categoria: formData.categoria || formData.category,
      ubicacion: formData.ubicacion || 'cafeteria',
      activo: typeof formData.activo === 'boolean' ? formData.activo : true,
      creado_por: formData.creado_por || 1
    }

    let ok = false
    try {
      if (editingProduct) {
        // Editing: update locally (you can extend to call backend update endpoint later)
        setProducts(products.map(p => p.id === editingProduct.id ? { ...p, ...formData } : p))
        setSubmitSuccess('Producto actualizado')
      } else {
        // Create: try to call backend
        const token = (() => { try { return localStorage.getItem('authToken') } catch (_) { return null } })()
        const res = await fetch('http://172.16.65.217:3001/api/producto/crear', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify(payload)
        })

        let data = {}
        try { data = await res.json() } catch (_) { data = {} }

        if (!res.ok) {
          // backend returned an error -> fall back to local add
          const msg = data.message || data.error || 'Error creando producto en backend'
          setSubmitError(msg)
          setProducts(prev => [...prev, { ...formData, id: Date.now() }])
          ok = false
        } else {
          // success - normalize created product if backend returned it
          const created = data.producto || data.result || data.data || data
          if (created && typeof created === 'object' && (created.idProducto || created.id || created.id_producto)) {
            const id = created.idProducto || created.id || created.id_producto
            // normalize returned image: if created.imagen is a raw base64 text, use data URL for preview
            let returnedImage = created.imagen || created.image || formData.image
            let returnedBase64 = ''
            if (typeof (created.imagen || created.image) === 'string') {
              const imgVal = created.imagen || created.image
              if (imgVal.startsWith && imgVal.startsWith('data:')) {
                returnedBase64 = imgVal.split(',')[1] || ''
                returnedImage = imgVal
              } else if (imgVal.length > 200) {
                returnedBase64 = imgVal
                returnedImage = `data:image/jpeg;base64,${imgVal}`
              }
            }

            const item = {
              id,
              nombre: created.nombre || formData.name,
              name: created.nombre || created.name || formData.name,
              descripcion: created.descripcion || formData.descripcion,
              precio: created.precio || formData.price,
              price: created.precio || formData.price,
              categoria: created.categoria || formData.categoria,
              category: created.categoria || formData.categoria,
              imagen: returnedBase64 || created.imagen || formData.image,
              image: returnedImage || created.imagen || created.image || formData.image,
              ubicacion: created.ubicacion || formData.ubicacion,
              creado_por: created.creado_por || formData.creado_por || 1,
              activo: (typeof created.activo === 'boolean') ? created.activo : (typeof formData.activo === 'boolean' ? formData.activo : true)
            }
            setProducts(prev => [...prev, item])
          } else {
            // backend didn't return full object - push a local entry
            setProducts(prev => [...prev, { ...formData, id: Date.now() }])
          }

          setSubmitSuccess('Producto creado correctamente')
          ok = true
        }
      }
    } catch (err) {
      // network error - fallback to local
      setSubmitError('Error de red. Producto guardado localmente.')
      setProducts(prev => [...prev, { ...formData, id: Date.now() }])
    } finally {
      setSubmitting(false)
      if (ok || editingProduct) closeModal()
    }
  }

  const handleDelete = (id) => {
    if (window.confirm('¿Estás seguro de eliminar este producto?')) {
      setProducts(products.filter(p => p.id !== id))
    }
  }

  const categories = ['Desayuno', 'Almuerzo', 'Postre', 'Otro']

  return (
    <div className="cafeteria-container">
      {/* Header */}
      <div className="cafeteria-header">
        <div className="cafeteria-header-content">
          <div>
            <h1 className="cafeteria-title">☕ Cafetería Admin</h1>
            <p className="cafeteria-subtitle">Gestiona tu menú y productos</p>
          </div>
          <button onClick={handleLogout} className="btn-logout">
            Cerrar sesión
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="cafeteria-main">
        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card orange">
            <div className="stat-label">Total Productos</div>
            <div className="stat-value orange">{products.length}</div>
          </div>
          <div className="stat-card green">
            <div className="stat-label">Precio Promedio</div>
            <div className="stat-value green">
              ${(products.reduce((acc, p) => acc + p.price, 0) / products.length).toFixed(2)}
            </div>
          </div>
          
          
        </div>

        {/* Actions Bar */}
        <div className="actions-bar">
          <h2 className="actions-title">Lista de Productos</h2>
          <button onClick={() => openModal()} className="btn-add">
            <Plus size={20} />
            Agregar Producto
          </button>
        </div>

        {/* Products Grid */}
        <div className="products-grid">
          {products.map(product => (
            <div key={product.id} className="product-card">
              <div className="product-image">
                <img src={product.image} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} />
              </div>
              <div className="product-content">
                <div className="product-header">
                  <h3 className="product-name">{product.name}</h3>
                  <span className="product-category">
                    {product.category}
                  </span>
                </div>
                
                
                <p className="product-desc">{product.descripcion || product.desc || ''}</p>

                <div className="product-info">
                  <div className="product-price">${product.price ? product.price.toFixed(2) : (product.precio ? product.precio.toFixed(2) : '0.00')}</div>
                </div>

                  <div className="product-meta">
                    <span className="badge ubicacion">{product.ubicacion || 'cafeteria'}</span>
                    <span className={`badge activo ${product.activo ? 'on' : 'off'}`}>{product.activo ? 'Activo' : 'Inactivo'}</span>
                  </div>

                <div className="product-actions">
                  <button onClick={() => openModal(product)} className="btn-edit">
                    <Edit size={16} />
                    Editar
                  </button>
                  <button onClick={() => handleDelete(product.id)} className="btn-delete">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">
                {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
              </h2>
              <button onClick={closeModal} className="btn-close">
                <X size={24} />
              </button>
            </div>

            <div className="modal-body">
              {submitError && (
                <div className="form-alert error">{submitError}</div>
              )}
              {submitSuccess && (
                <div className="form-alert success">{submitSuccess}</div>
              )}
              {submitting && (
                <div className="form-alert info">Enviando…</div>
              )}
              <div className="form-group">
                <label className="form-label">
                  <Tag size={16} />
                  Nombre del Producto
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="form-input"
                  placeholder="Ej: Café Latte"
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  <DollarSign size={16} />
                  Precio
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                  className="form-input"
                  placeholder="0.00"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Categoría</label>
                <select
                  value={formData.categoria || formData.category}
                  onChange={(e) => setFormData({ ...formData, categoria: e.target.value, category: e.target.value })}
                  className="form-select"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              

              <div className="form-group">
                <label className="form-label">Descripción</label>
                <textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  className="form-textarea"
                  placeholder="Descripción del producto"
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Ubicación</label>
                <select
                  value={formData.ubicacion}
                  onChange={(e) => setFormData({ ...formData, ubicacion: e.target.value })}
                  className="form-select"
                >
                  <option value="cafeteria">cafeteria</option>
                  <option value="rooftop">rooftop</option>
                  <option value="ambos">ambos</option>
                </select>
              </div>

              <div className="form-group form-row">
                <label className="form-label">Activo</label>
                <input
                  type="checkbox"
                  checked={!!formData.activo}
                  onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                  aria-label="Activo"
                />
              </div>

              

              <div className="form-group">
                <label className="form-label">
                  <ImageIcon size={16} />
                  Imagen del Producto
                </label>
                
                {/* Preview de la imagen */}
                {formData.image && (
                  <div className="image-preview">
                    <img src={formData.image} alt="Preview" />
                  </div>
                )}
                
                {/* Input para subir archivo */}
                <div className="file-input-wrapper">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="file-input"
                    id="image-upload"
                  />
                  <label htmlFor="image-upload" className="file-input-label">
                    📁 Seleccionar imagen del dispositivo
                  </label>
                </div>
              </div>

              <div className="modal-footer">
                <button onClick={closeModal} className="btn-cancel">
                  Cancelar
                </button>
                <button onClick={handleSubmit} disabled={submitting} className="btn-submit">
                  {submitting ? (editingProduct ? 'Guardando...' : 'Creando...') : (editingProduct ? 'Guardar Cambios' : 'Crear Producto')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
