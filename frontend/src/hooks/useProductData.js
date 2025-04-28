import { useState, useEffect } from 'react';
import axios from 'axios';
import { getProductCategories } from '../services/productCategoryService';

const useProductData = () => {
  const [products, setProducts] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 獲取所有產品
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'x-auth-token': token
        }
      };
      
      const res = await axios.get('/api/products', config);
      
      // 分離商品和藥品
      const productsList = [];
      const medicinesList = [];
      
      res.data.forEach(item => {
        const product = {
          ...item,
          id: item._id
        };
        
        if (item.productType === 'product') {
          productsList.push(product);
        } else if (item.productType === 'medicine') {
          medicinesList.push(product);
        }
      });
      
      setProducts(productsList);
      setMedicines(medicinesList);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('獲取產品失敗');
      setLoading(false);
    }
  };

  // 獲取所有供應商
  const fetchSuppliers = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'x-auth-token': token
        }
      };
      
      const res = await axios.get('/api/suppliers', config);
      setSuppliers(res.data);
    } catch (err) {
      console.error(err);
      setError('獲取供應商失敗');
    }
  };
  
  // 獲取所有產品分類
  const fetchCategories = async () => {
    try {
      const data = await getProductCategories();
      setCategories(data);
    } catch (err) {
      console.error(err);
      setError('獲取產品分類失敗');
    }
  };

  // 處理刪除產品
  const handleDeleteProduct = async (id) => {
    if (window.confirm('確定要刪除此產品嗎？')) {
      try {
        const token = localStorage.getItem('token');
        const config = {
          headers: {
            'x-auth-token': token
          }
        };
        
        await axios.delete(`/api/products/${id}`, config);
        
        // 更新本地狀態
        setProducts(products.filter(p => p.id !== id));
        setMedicines(medicines.filter(p => p.id !== id));
        
        return true;
      } catch (err) {
        console.error(err);
        setError('刪除產品失敗');
        return false;
      }
    }
    return false;
  };

  // 處理保存產品
  const handleSaveProduct = async (productData, editMode, productType) => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        }
      };
      
      let response;
      if (editMode) {
        // 更新產品
        response = await axios.put(`/api/products/${productData.id}`, productData, config);
        
        // 更新本地狀態
        if (productType === 'product') {
          setProducts(products.map(p => 
            p.id === productData.id ? { ...response.data, id: response.data._id, productType: 'product' } : p
          ));
        } else {
          setMedicines(medicines.map(p => 
            p.id === productData.id ? { ...response.data, id: response.data._id, productType: 'medicine' } : p
          ));
        }
      } else {
        // 創建新產品
        const endpoint = productType === 'medicine' 
          ? '/api/products/medicine' 
          : '/api/products/product';
        response = await axios.post(endpoint, productData, config);
        
        // 更新本地狀態
        const newProduct = {
          ...response.data,
          id: response.data._id,
          productType
        };
        
        if (productType === 'product') {
          setProducts([...products, newProduct]);
        } else {
          setMedicines([...medicines, newProduct]);
        }
      }
      
      return response.data;
    } catch (err) {
      console.error(err);
      setError('保存產品失敗');
      return null;
    }
  };

  // 初始化
  useEffect(() => {
    fetchProducts();
    fetchSuppliers();
    fetchCategories();
  }, []);

  return {
    products,
    medicines,
    suppliers,
    categories,
    loading,
    error,
    fetchProducts,
    fetchSuppliers,
    fetchCategories,
    handleDeleteProduct,
    handleSaveProduct
  };
};

export default useProductData;
