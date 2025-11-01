const decimalTohex = (decimal) => {
    try {
        const bigInt = BigInt(decimal);

        const hexValue = bigInt.toString(16);

        return hexValue;
    } catch (error) {
        console.error('decimalToHex error:', error);

        return null;
    }
}

module.exports = decimalTohex;