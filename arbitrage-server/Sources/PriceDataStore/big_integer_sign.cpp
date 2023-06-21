#include "include/big_integer_sign.hpp"

using namespace std;

#define BNsign BigIntegerSign

BNsign::BNsign() : sign(false) {}

BNsign::BNsign(const BNsign &bn) : value(bn.value), sign(bn.sign) {}

BNsign::BNsign(BNsign &&bn) noexcept
    : value(std::move(bn.value)), sign(bn.sign) {}

BNsign::BNsign(BN &&bn, const bool bnsign) noexcept
    : value(std::move(bn)), sign(bnsign) {}

BNsign::BNsign(const BN &bn, const bool bnsign) : value(bn), sign(bnsign) {}

BNsign &BNsign::operator=(const BNsign &bn) {
  if (this == &bn)
    return *this;

  value = bn.value;
  sign = bn.sign;

  return *this;
}

BNsign &BNsign::operator=(BNsign &&bn) noexcept {
  if (this == &bn)
    return *this;
  value = std::move(bn.value);
  sign = bn.sign;

  return *this;
}

const BNsign BNsign::operator+(const BNsign &bn) const {
  return std::move(BNsign(*this) += bn);
}

BNsign &BNsign::operator+=(const BNsign &bn) {
  bool firstIsGreater = (this->value >= bn.value);

  if (sign == bn.sign)
    value += bn.value;
  else {
    if (firstIsGreater)
      value -= bn.value;
    else
      value = bn.value - value;
  }

  sign = ((bn.sign && !firstIsGreater) || (sign && firstIsGreater));
  return *this;
}

const BNsign BNsign::operator-(const BNsign &bn) const {
  return std::move(BNsign(*this) -= bn);
}

BNsign &BNsign::operator-=(const BNsign &bn) {
  bool firstIsGreater = (this->value >= bn.value);
  bool newSign = !(bn.sign || firstIsGreater) || (sign && firstIsGreater);

  if (sign != bn.sign) {
    value += bn.value;
    sign = newSign;
    return *this;
  }

  sign = newSign;
  if (firstIsGreater) {
    value -= bn.value;
    return *this;
  }

  value = bn.value - value;
  return *this;
}

const BNsign BNsign::operator*(const BNsign &bn) const {
  BNsign res;
  res.value = this->value * bn.value;
  res.sign = this->sign ^ bn.sign;
  return res;
}

//string signToChar(bool sign) { return sign ? "-" : "+"; }
//
//string to_string(const BNsign &bn) {
//  return signToChar(bn.sign) + to_string(bn.value);
//}
//
//string to_hexstring(const BNsign &bn) {
//  return signToChar(bn.sign) + to_hexstring(bn.value);
//}
