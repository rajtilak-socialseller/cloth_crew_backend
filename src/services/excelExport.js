const XLSX = require('xlsx');

module.exports = async (data) => {
    try {

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
        const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
        return buffer
    } catch (error) {
        //console.log(error)
        return { error }
    }
}