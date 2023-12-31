import React, { useState, useEffect } from 'react';
import '../styles.css';
import Mittarilukema1 from './Mittarilukema1';
import Mittarilukema2 from './Mittarilukema2';
import Nappi from './Nappi';
import Aika from './Aika';
import Tuntivalitsin from './Tuntivalitsin';
import Kiintea from './Kiintea';
import Latauskerrat from './Latauskerrat';
import Tiedostolataus1 from './Tiedostolataus1';
import Poistakaikki from './Poistakaikki';

function Latauslaskuri() {

  const [lastFixedPrice, setLastFixedPrice] = useState();
  const [lastMeterNum, setLastMeterNum] = useState();
  const [selectedHour, setSelectedHour] = useState(0);
  const [selectedMinute, setSelectedMinute] = useState(0);
  const [selectedStartingDate, setSelectedStartingDate] = useState();
  const [selectedStartingTime, setSelectedStartingTime] = useState();
  const [selectedMeterNum, setSelectedMeterNum] = useState();
  const [selectedFixedPrice, setSelectedFixedPrice] = useState();
  const [lastLoading, setLastLoading] = useState(0);
  const [fixPerKWh, setFixPerKWh] = useState();

  const handleHourChange = (hour) => {
    setSelectedHour(hour);
  };

  const handleMinuteChange = (minute) => {
    setSelectedMinute(minute);
  };

  const handleStartingDateChange = (date) => {
    setSelectedStartingDate(date);
  };
    
  const handleStartingTimeChange = (time) => {
    setSelectedStartingTime(time);
  };

  const handleMeterNumChange = (meterNum) => {
    setSelectedMeterNum(parseFloat(meterNum));
  };
  
  const handleLastMeterNumChange = (lastMeterNum) => {
    setLastMeterNum(parseFloat(lastMeterNum));
  };

  const handleFixedPriceChange = (fixedPrice) => {
    setSelectedFixedPrice(fixedPrice);
  };

  useEffect(() => {
    getLastItemFixedPrice();
    getFixPerkWh();
    getLastLoading();
  }, []);

  const getLastLoading = async () => {
    try {
      const response = await fetch('http://localhost:3001/loadings');
  
      if (response.ok) {
        const data = await response.json();
        const lastItem = data[data.length - 1];  
        if (lastItem) {
          setLastLoading(lastItem)
          setLastMeterNum(lastItem.meterNum)
        } else {
          console.log('No items found');
        }
      } else {
        console.error('Error fetching loadings:', response.status);
      }
    } catch (error) {
      console.error('Error fetching loadings:', error);
    }
  };

  const getLastItemFixedPrice = async () => {
    try {
      const response = await fetch('http://localhost:3001/loadings');
  
      if (response.ok) {
        const data = await response.json();
        const lastItem = data[data.length - 1];  
        if (lastItem) {
          setLastFixedPrice(lastItem.fixedPrice);
          setSelectedFixedPrice(lastItem.fixedPrice);
        } else {
          console.log('No items found');
        }
      } else {
        console.error('Error fetching loadings:', response.status);
      }
    } catch (error) {
      console.error('Error fetching loadings:', error);
    }
  };
  
  const getFixPerkWh = async () => {
    try {
      const response = await fetch('http://localhost:3001/settings');
  
      if (response.ok) {
        const data = await response.json();
        setFixPerKWh(data[data.length - 1].fixPerKWh);  
      } else {
        console.error('Error fetching settings:', response.status);
       }
    } catch (error) {
      console.error('Error fetching loadings:', error);
    }
};

  const handleSave = async () => {
    const startingDate = new Date(`${selectedStartingDate}T${selectedStartingTime}:00.000`);
    const endingDate = new Date(startingDate.getTime() + selectedMinute * 60000);
    endingDate.setMinutes(endingDate.getMinutes() + selectedHour * 60);
    const finalKWh = parseFloat((selectedMeterNum - lastMeterNum).toFixed(2));
    const finalTime = selectedMinute + selectedHour * 60
    let finalPrice = 0;

    const sntKWhArray = [];

    let date = startingDate;
    let year = date.getFullYear();
    let month = String(date.getMonth() + 1).padStart(2, '0');
    let day = String(date.getDate()).padStart(2, '0');

    for (let i = selectedHour * 60 + selectedMinute + date.getMinutes(); i > 1; i -= 60) {
      const response = await fetch(`http://localhost:3001/${year}-${month}-${day}%${date.getHours()}`);
      const jsonData = await response.json();
      const formattedHour = date.getHours().toString().padStart(2, '0') + ':00';

      if (i === selectedHour * 60 + selectedMinute + date.getMinutes()) {
        const timeShare = (60 - startingDate.getMinutes()) / finalTime;
        const price = parseFloat(timeShare * finalKWh * parseFloat(jsonData.price));
        sntKWhArray.push({ hour: formattedHour, kWhPrice: jsonData.price, price: price, kWh: timeShare * finalKWh });
        finalPrice += price;
      }
      else if (i  >= 60) {
        const price = parseFloat((60 / finalTime) * finalKWh * parseFloat(jsonData.price));
        sntKWhArray.push({ hour: formattedHour, kWhPrice: jsonData.price, price: price, kWh: (60 / finalTime) * finalKWh });
        finalPrice += price;
      }
      else {
        const price = endingDate.getMinutes() / finalTime * finalKWh * parseFloat(jsonData.price);
        sntKWhArray.push({ hour: formattedHour, kWhPrice: jsonData.price, price: price, kWh: endingDate.getMinutes() / finalTime * finalKWh });
        finalPrice += price;
      }
      date.setHours(startingDate.getHours() + 1);
      date = startingDate;
      year = date.getFullYear();
      month = String(date.getMonth() + 1).padStart(2, '0');
      day = String(date.getDate()).padStart(2, '0');
    }

    console.log(lastLoading)
    const newLoading = {
      date: `${selectedStartingDate}T${selectedStartingTime}:00.000+00:00`,
      hour: selectedHour,
      minute: selectedMinute,
      price: finalPrice < 0 ? 0 : parseFloat(finalPrice.toFixed(3)),
      kWh: parseFloat(finalKWh),
      meterNum: parseFloat(selectedMeterNum),
      sntkWh: sntKWhArray,
      fixedPrice: selectedFixedPrice,
      totalFixedPrice: lastLoading ? (lastLoading.totalFixedPrice + finalKWh * selectedFixedPrice) : (finalKWh * selectedFixedPrice),
      totalKWh: lastLoading ? (lastLoading.totalKWh + parseFloat(finalKWh)) : parseFloat(finalKWh),
      transportPrice: lastLoading ? (lastLoading.transportPrice + parseFloat(finalKWh) * fixPerKWh * 100) : (parseFloat(finalKWh) * fixPerKWh * 100),
      totalElectricityPrice: lastLoading ? (lastLoading.totalElectricityPrice + finalPrice) : finalPrice,
      totalPrice: lastLoading ? (lastLoading.totalPrice + parseFloat(finalKWh) * fixPerKWh * 100 + (finalPrice < 0 ? 0 : finalPrice) + finalKWh * selectedFixedPrice) : (parseFloat(finalKWh) * fixPerKWh * 100 + (finalPrice < 0 ? 0 : finalPrice) + finalKWh * selectedFixedPrice),
    };

    if (
      selectedStartingDate &&
      (selectedHour || selectedMinute) &&
      selectedStartingTime &&
      selectedMeterNum &&
      selectedFixedPrice
    ) {
      try {
        const response = await fetch('http://localhost:3001/loadings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newLoading),
        });

        if (response.ok) {
          window.alert('Latauskerta tallennettu');
          window.location.reload();
        } else {
          window.alert('Tarkista päivämäärä');
        }
      } catch (error) {
        console.error('Error saving loading:', error);
      }
    } else {
      window.alert('Täytä kaikki kentät');
    }
  };

  return (
    <div className="div0">
      <div className="div1">
        <div className='div0'>
          <Tiedostolataus1/>
          <Poistakaikki object="loadings"/>
        </div>
        <Mittarilukema1
          lastMeterNum={lastLoading.meterNum}
          onLastMeterNumChange={handleLastMeterNumChange}
        />
        <Aika
          selectedStartingTime={selectedStartingTime}
          selectedStartingDate={selectedStartingDate}
          onStartingTimeChange={handleStartingTimeChange}
          onStartingDateChange={handleStartingDateChange}
        />
        <Tuntivalitsin
          selectedHour={selectedHour}
          selectedMinute={selectedMinute}
          onHourChange={handleHourChange}
          onMinuteChange={handleMinuteChange}
        />
        <Mittarilukema2
          selectedMeterNum={selectedMeterNum}
          onMeterNumChange={handleMeterNumChange}
        />
        <Kiintea
          lastFixedPrice={lastFixedPrice}
          selectedFixedPrice={selectedFixedPrice}
          onFixedPriceChange={handleFixedPriceChange}
        />
        <Nappi onSave={handleSave} />
        <Latauskerrat />
      </div>
    </div>
  );
}

export default Latauslaskuri;