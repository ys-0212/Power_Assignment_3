export class Complex {
  constructor(public r: number, public i: number) {}

  static fromPolar(mag: number, angleRad: number): Complex {
    return new Complex(mag * Math.cos(angleRad), mag * Math.sin(angleRad));
  }

  static fromPolarDeg(mag: number, angleDeg: number): Complex {
    const angleRad = angleDeg * (Math.PI / 180);
    return new Complex(mag * Math.cos(angleRad), mag * Math.sin(angleRad));
  }

  static fromRect(r: number, i: number): Complex {
    return new Complex(r, i);
  }

  get mag(): number {
    return Math.sqrt(this.r * this.r + this.i * this.i);
  }

  get angle(): number { // radians
    return Math.atan2(this.i, this.r);
  }

  get angleDeg(): number {
    return this.angle * (180 / Math.PI);
  }

  add(other: Complex | number): Complex {
    if (typeof other === 'number') {
      return new Complex(this.r + other, this.i);
    }
    return new Complex(this.r + other.r, this.i + other.i);
  }

  sub(other: Complex | number): Complex {
    if (typeof other === 'number') {
      return new Complex(this.r - other, this.i);
    }
    return new Complex(this.r - other.r, this.i - other.i);
  }

  mul(other: Complex | number): Complex {
    if (typeof other === 'number') {
      return new Complex(this.r * other, this.i * other);
    }
    return new Complex(
      this.r * other.r - this.i * other.i,
      this.r * other.i + this.i * other.r
    );
  }

  div(other: Complex | number): Complex {
    if (typeof other === 'number') {
      return new Complex(this.r / other, this.i / other);
    }
    const den = other.r * other.r + other.i * other.i;
    return new Complex(
      (this.r * other.r + this.i * other.i) / den,
      (this.i * other.r - this.r * other.i) / den
    );
  }

  conjugate(): Complex {
    return new Complex(this.r, -this.i);
  }

  exp(): Complex {
    const ea = Math.exp(this.r);
    return new Complex(ea * Math.cos(this.i), ea * Math.sin(this.i));
  }

  sqrt(): Complex {
    const rootMag = Math.sqrt(this.mag);
    const halfAngle = this.angle / 2;
    return Complex.fromPolar(rootMag, halfAngle);
  }

  cosh(): Complex {
    const a = this.r;
    const b = this.i;
    return new Complex(
      Math.cosh(a) * Math.cos(b),
      Math.sinh(a) * Math.sin(b)
    );
  }

  sinh(): Complex {
    const a = this.r;
    const b = this.i;
    return new Complex(
      Math.sinh(a) * Math.cos(b),
      Math.cosh(a) * Math.sin(b)
    );
  }

  tanh(): Complex {
    return this.sinh().div(this.cosh());
  }

  toString(fixed = 4): string {
    const absI = Math.abs(this.i).toFixed(fixed);
    return `${this.r.toFixed(fixed)} ${this.i >= 0 ? '+' : '-'} j${absI}`;
  }
  
  toPolarString(fixed = 4): string {
    return `${this.mag.toFixed(fixed)} ∠ ${this.angleDeg.toFixed(2)}°`;
  }
}
