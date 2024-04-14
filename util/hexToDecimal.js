const hexToDecimal = (hex) => {
    if (hex.length % 2) { hex = '0' + hex; }

    const bigInt = BigInt('0x' + hex);

    const decimal = bigInt.toString(10);

    return decimal;
}

module.exports = hexToDecimal;