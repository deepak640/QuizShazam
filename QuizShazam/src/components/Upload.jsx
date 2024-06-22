const handleSubmit = async (e) => {
  e.preventDefault();
  if (file) {
    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        const workbook = XLSX.read(event.target.result, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const headers = [];
        const data = [];

        // Get the header row
        const headerRow = worksheet.data[0];
        headerRow.forEach((cell) => {
          headers.push(cell.v);
        });

        // Iterate through the remaining rows
        for (let i = 1; i < worksheet.data.length; i++) {
          const row = worksheet.data[i];
          const rowData = {};
          row.forEach((cell, j) => {
            rowData[headers[j]] = cell.v;
          });
          data.push(rowData);
        }

        console.log("🚀 ~ handleSubmit ~ data:", data);
        setData(data);
        // Send data to backend API
        setSuccess(true);
        setError(false);
      };
      reader.readAsArrayBuffer(file);
    } catch (error) {
      setError(true);
      setSuccess(false);
    }
  }
};
