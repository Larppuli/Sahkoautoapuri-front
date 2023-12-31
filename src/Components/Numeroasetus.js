import React from 'react';

function Numeroasetus({ onValueChange, selectedValue, name, defaultValue, selectedStep }) {
  const handleValueChange = (event) => {
    const selectedValue = event.target.value;
    onValueChange(selectedValue);
  };

  return (
    <div className='form1'>
      <div className='div3'>{name}</div>
      <input
        className="input1"
        type="number"
        step={selectedStep}
        value={selectedValue !== undefined ? selectedValue : defaultValue !== undefined ? defaultValue : ''}
        onChange={handleValueChange}
      />
    </div>
  );
}

export default Numeroasetus;