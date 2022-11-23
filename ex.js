const greet = ({ first, last }) => `Hello ${first} ${last}!`

// 3 nest
const mon = {
  schema: 1,
  model: 1,
  types: {
    objId: 1,
  },
}

const mongo = {
  schema: {
    n: 1,
    types: {
      objId: 1,
    },
  },
  model: 1,
}

const {
  schema: {
    types: { objId },
  },
  schema,
} = mongo

console.log(schema, objId)

const obj = {
  prop1: 'hello',
  prop2: {
    subprop1: 1,
    subprop2: function (n) {
      return this.subprop1 + n
    },
  },
  prop3: (n) => n + 2,
  greet,
}

const { prop1, greet: prop4 } = obj
console.log(prop1)
console.log(prop4({ first: 'Juana', last: 'Maria' }))

console.log(obj.prop2.subprop2(5), obj.prop3(5))

// 'this' does not work when destructuring
const {
  prop2: { subprop2 },
  prop3,
} = obj

console.log(subprop2(5), prop3(5))

// Classes
class Human {
  constructor({ first, last }) {
    this.name = first
    this.lastName = last
  }

  age = 20

  isMinor() {
    return this.age < 18
  }
}

const me = new Human({ first: 'Jordi', last: 'Calafat' })
me.region = 'ESP'
console.log(me, me.isMinor())

class ExtendedHuman extends Human {
  isAdmin = true
}

const newMe = new ExtendedHuman({ first: 'newJordi', last: 'newCala' })
console.log(newMe)
