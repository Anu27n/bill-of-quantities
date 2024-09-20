import React, { useState, useMemo, useEffect } from 'react';
import './boq.css';
import { Slider } from '@mui/material';
import ProductForm from './form';
import { supabase } from './supabase';


const Card = ({ title, price, image,details, addOns, initialMinimized = false }) => {
  const [selectedAddOns, setSelectedAddOns] = useState({});
  const [isMinimized, setIsMinimized] = useState(initialMinimized);
  const basePrice = price;

  const handleAddOnChange = (addOn, isChecked) => {
    setSelectedAddOns((prevSelectedAddOns) => ({
      ...prevSelectedAddOns,
      [addOn.name]: isChecked ? addOn.price : 0,
    }));
  };

  const calculateTotalPrice = useMemo(() => {
    return Object.values(selectedAddOns).reduce((total, addOnPrice) => total + addOnPrice, basePrice);
  }, [selectedAddOns, basePrice]);

  const toggleMinimize = () => setIsMinimized((prev) => !prev);

  if (isMinimized) {
    return (
      <div className="minimized-card" onClick={toggleMinimize}>
        <span>{title}</span>
        <div className="info">
          <p>Base Price: ₹{basePrice}</p>
          <p>Total Price: ₹{calculateTotalPrice}</p>
        </div>
        <button className="start-button">Start</button>
      </div>
    );
  }

  return (
    <>
    <div className="card-container">
      <CardSection className="card-image">
        <img src={image} alt={title} className="image" />
      </CardSection>

      <CardSection className="card-features">
      
        <h3>{title}</h3>
        <p>{details}</p>
      </CardSection>

      <CardSection className="card-add-ons">
      <h3>ADD ON</h3>
        <ul>
          {addOns.map((addOn, index) => (
            <li key={index}>
              <label>
                <input
                  type="checkbox"
                  onChange={(e) => handleAddOnChange(addOn, e.target.checked)}
                />
                {addOn.name} (+₹{addOn.price})
              </label>
            </li>
          ))}
        </ul>
      </CardSection>

      <CardSection className="card-summary">
        <h4>Summary</h4>
        <p>Base Price: ₹{basePrice}</p>
        <p>Add-Ons: ₹{Object.values(selectedAddOns).reduce((total, price) => total + price, 0)}</p>
        <p>Total Price: ₹{calculateTotalPrice}</p>
        <button className="done-button" onClick={toggleMinimize}>Done</button>
      </CardSection>
    </div>
    </>
  );
};

const CardSection = ({ className, children }) => {
  return <div className={`card ${className}`}>{children}</div>;
};

const App = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [priceRange, setPriceRange] = useState([1000, 5000]);
  const [compareList, setCompareList] = useState([]);

  const [productsData,setProductData] = useState([]);
  async function getProducts(){
    return await supabase.from("products").select();
  }

  useEffect(()=>{
    getProducts().then(async ({data, error})=>{
      if(error){ console.error(error);return;}
      let newData = [];
      for(let ind in data){
        let obj = data[ind];
        const {data:Photo, error:PhotoError} = await supabase.storage.from("addon").createSignedUrl(`${obj.image}`, 3600);
        console.log(PhotoError)
        const {data:addons, error:addonsError} = await supabase.from("addons").select().eq("productid",obj.id);
        let addonsList=[]
        for(let adn in addons){
          let adf = addons[adn];
          const {data:Photo2, error:PhotoError2} = await supabase.storage.from("addon").createSignedUrl(`${adf.image}`,3600);
          console.log(PhotoError2)
          addonsList.push({...adf, image:Photo2.signedUrl})
        }
        newData.push({...obj, addons:addonsList, image:Photo.signedUrl});
      }
      setProductData(newData);
    });
  },[])
  const handleSearch = (event) => {
    setSearchQuery(event.target.value.toLowerCase());
  };

  const handleSliderChange = (event, newValue) => {
    setPriceRange(newValue);
  };

  const handleCompareToggle = (product) => {
    setCompareList((prevCompareList) => {
      if (prevCompareList.includes(product)) {
        return prevCompareList.filter((item) => item !== product);
      } else {
        return [...prevCompareList, product];
      }
    });
  };

  // const filteredProducts = productsData.filter((product) => {
  //   const price = parseInt(product.price.replace('₹', ''), 10);
  //   return (
  //     product.title.toLowerCase().includes(searchQuery) &&
  //     price >= priceRange[0] &&
  //     price <= priceRange[1]
  //   );
  // });

  return (
    <div className="App">
      <div className="search-filter">
        <input
          type="text"
          placeholder="Search products..."
          value={searchQuery}
          onChange={handleSearch}
          className="search-bar"
        />
        <Slider
          value={priceRange}
          onChange={handleSliderChange}
          valueLabelDisplay="auto"
          min={1000}
          max={5000}
          className="price-slider"
        />
      </div>

      <div className="products-grid">
      {productsData.map((product, index) => (
  <div key={index}>
    <Card
      title={product.title}
      price={product.price}
      details={product.details}
      addOns={product.addons}
      image={product.image}
      initialMinimized={product.initialMinimized}
    />
  </div>
))}
      </div>
<ProductForm />
     </div>
    
   );

};

export default App;