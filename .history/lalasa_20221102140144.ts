import { PrismaClient } from '@prisma/client'
import express, { query } from 'express'
import bodyParser from 'body-parser'
import e from 'express'
import cors from "cors"
import { ALL } from 'dns'
import https from 'https';
import multer from 'multer';
import fs from 'fs';
import moment from 'moment-timezone'
import { type } from 'os'
const excel = require("exceljs");
const otpGenerator = require('otp-generator')

var path = require('path');
const readXlsxFile = require("read-excel-file/node");

var nodemailer = require('nodemailer');
var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'networksoftwaresolution@gmail.com',
    pass: 'fcthgkjazqcxeusr'
  },
  tls: { rejectUnauthorized: false }
});

const subject = "LALASA\nDear *\n\nWelcome to LALASA.\n\nONE STOP. ONE APP \n\nYour one stop location to access all our services from LALASA and many more to come.\n\nYour registration particulars are shown below.\n\nUsername : ** \nRegisters email : # \nOTP : ***\n\nYour password need not be changed. However if you wish to make changes to your password you may do so by selecting “Change Password” option from your app.\n\nA four digit verification code will be sent to your registered email to verify your user credentials, upon successful verification you can change your password.\n\nAll purchases made through the app can be seen under your user profile.\n\nThank you for joining the LALASA community.\n\nSincerely,\n\nTeam LALASA"
const sbKey = 'AAAAJfJaPz0:APA91bGGT5HqyfpdbeCs4ydceex8RkjaXOKYea2eDEhxAoj-m502UG-cQfpGBuZ-qEvXCPJ1Jl7VBSo22MhKt9Asmi9qIXDFEG-YLQSztaFXtn7LlVgRyiyCWtF0ROktKu3edNHxbtRX'

const prisma = new PrismaClient()
const app = express()

app.use(express.json())
app.use(cors())

var router = express.Router();

//options for cors midddleware
const options: cors.CorsOptions = {
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'X-Access-Token',
  ],
  credentials: true,
  methods: 'GET,HEAD,OPTIONS,PUT,PATCH,POST,DELETE',
  origin: "networkgroups.in",
  preflightContinue: false,
};

//use cors middleware
router.use(cors(options));

//add your routes

//enable pre-flight
router.options('*', cors(options));

app.use(express.urlencoded({ extended: true, }))

app.get("/health_check", (_, res) => {
  res.status(200).end();
});

app.post('/prisma/lalasa/register', async (req, res) => {
  await executeLatinFunction()
  var name = req.body.name
  var email = req.body.email
  var gender = req.body.gender
  var address = req.body.address ? req.body.address : "Not Specified"
  var cc = req.body.cc
  var phone = req.body.phone
  var password = req.body.password
  var image = req.body.image ? req.body.image : "https://cdn4.iconfinder.com/data/icons/small-n-flat/24/user-512.png"
  var pincode = req.body.pincode
  var otp = Math.floor(1000 + Math.random() * 9000);
  if (name && email && gender && address && cc && phone && password && image && pincode) {
    const resultUser = await prisma.lalasa_user.findFirst({
      where: { phone: phone }
    });
    if (!resultUser) {
      const authkey = require('crypto').randomBytes(16).toString('hex')
      const result = await prisma.lalasa_user.create({
        data: { name: name, email: email, gender: gender, address: address, cc: cc, phone: phone, password: password, image: image, pincode: pincode, otp: otp + "", auth_key: authkey }
      });

      if (result) {
        var mailOptions = {
          from: 'networksoftwaresolution@gmail.com',
          to: result.email,
          subject: "Welcome to LALASA",
          text: subject.replace('***', otp + "").replace('#', result.email).replace('**', result.name).replace("*", result.name)
        };
        sendmail(mailOptions)
        res.json({
          "otp": result.otp, "message": "user successfully created.", "success": true
        })
      } else {
        res.json({ "message": "Oops! An error occurred.", "success": false })
      }
    } else {
      res.json({ "message": "Phone Number already taken. Existing User", "success": false })
    }
  } else {
    res.json({ "message": "Required fields missing", "success": false });
  }
})

app.put('/prisma/lalasa/register', async (req, res) => {
  await executeLatinFunction()
  var image = req.body.image ? req.body.image : "https://cdn4.iconfinder.com/data/icons/small-n-flat/24/user-512.png"
  var name = req.body.name
  var email = req.body.email
  var gender = req.body.gender
  var phone = req.body.phone
  var address = req.body.address
  var pincode = req.body.pincode
  var userId = req.body.userId
  if (image && name && email && gender && phone && address && pincode && userId) {
    const result = await prisma.lalasa_user.update({
      where: { id: Number(userId) },
      data: { image: image, name: name, email: email, gender: gender, phone: phone, address: address, pincode: pincode }
    });

    if (result) {
      res.json({
        "data": result, "message": "Profile successfully updated.", "success": true
      })
    } else {
      res.json({ "message": "Oops! An error occurred.", "success": false })
    }
  } else {
    res.json({ "message": "Required fields missing", "success": false });
  }
})

app.post('/prisma/lalasa/verify_otp', async (req, res) => {
  await executeLatinFunction()
  var phone = req.body.phone
  var otp = req.body.otp
  if (phone && otp) {
    const result = await prisma.lalasa_user.findFirst({
      where: { OR: [{ email: phone }, { phone: phone }] },
    });
    if (result) {
      res.json({ "message": "otp verified successfully.", "success": true });
    } else {
      res.json({ "message": "User not found.", "success": false });
    }
  } else {
    res.json({ "message": "Required fields missing", "success": false });
  }
})

app.post('/prisma/lalasa/login', async (req, res) => {
  await executeLatinFunction()
  var phone = req.body.phone
  var password = req.body.password
  console.log(req.body)
  if (phone && password) {
    const result = await prisma.lalasa_user.findFirst({
      where: { AND: [{ OR: [{ name: phone }, { phone: phone }, { email: phone }] }, { password: password }] }
    });

    if (result) {
      const authkey = require('crypto').randomBytes(16).toString('hex')
      const resultUser = await prisma.lalasa_user.update({
        where: { id: Number(result.id) },
        data: { auth_key: authkey }
      });

      if (result) {
        res.json({ "data": result, "message": "Welcome to LALASA.", "success": true });

      } else {
        res.json({ "message": "Oops! An error occurred.", "success": false })
      }
    } else {
      res.json({ "message": "Invalid Password ", "success": false })
    }
  } else {
    res.json({ "message": "Required fields missing", "success": false });
  }
})

app.post('/prisma/lalasa/admin_register', async (req, res) => {
  await executeLatinFunction()
  var name = req.body.name
  var phone = req.body.phone
  var password = req.body.password
  var address = req.body.address
  var category = req.body.category
  var status = req.body.status ? req.body.status : "registered"
  var role = req.body.role
  var rating = req.body.rating ? req.body.rating : "5"
  var latlong = req.body.latlong ? req.body.latlong : "Not Specified"
  var image = req.body.image
  var pincode = req.body.pincode
  if (name && phone && password && address && category && status && role && rating && latlong && image && pincode) {
    const resultUser = await prisma.lalasa_shop.findFirst({
      where: { phone: phone }
    });
    if (!resultUser) {
      const result = await prisma.lalasa_shop.create({
        data: { name: name, phone: phone, password: password, address: address, category: category, status: status, role: role, rating: rating, latlong: latlong, image: image, pincode: pincode }
      });

      if (result) {
        res.json({
          "data": result, "message": "Shop successfully created.", "success": true
        })
      } else {
        res.json({ "message": "Oops! An error occurred.", "success": false })
      }
    } else {
      res.json({ "message": "Phone Number already taken. Existing User", "success": false })
    }
  } else {
    res.json({ "message": "Required fields missing", "success": false });
  }
})

app.post('/prisma/lalasa/admin_login', async (req, res) => {
  await executeLatinFunction()
  var phone = req.body.phone
  var password = req.body.password
  if (phone && password) {
    const result = await prisma.lalasa_shop.findFirst({
      where: { AND: [{ OR: [{ name: phone }, { phone: phone }] }, { password: password }] }
    });
    if (result) {
      if (result.status == 'Approved') {
        if (result.isDelete == '1') {
          res.json({ "data": result, "message": "Welcome to LALASA.", "success": true });
        } else {
          res.json({ "message": "Account not found. ", "success": false })
        }
      } else {
        res.json({ "message": "Waiting for Admin Approved. ", "success": false })
      }
    }
    else {
      res.json({ "message": "Invalid Credential", "success": false })
    }
  } else {
    res.json({ "message": "Required fields missing", "success": false });
  }
})

app.get('/prisma/lalasa/admin', async (req, res) => {
  await executeLatinFunction()
  var id = req.query.id
  const result = await prisma.lalasa_shop.findMany({
    where: id ? { id: Number(id) } : {},
    orderBy: { id: "asc" }
  })
  if (result) {
    res.json({ "data": result, "success": true });
  } else {
    res.json({ "message": "No Admin found.", "success": false });
  }
})

app.get('/prisma/lalasa/register', async (req, res) => {
  await executeLatinFunction()
  var userId = req.query.userId
  const result = await prisma.lalasa_user.findMany({
    where: userId ? { id: Number(userId) } : {},
    orderBy: { id: "desc" },
  });
  if (result) {
    res.json({ "data": result, "message": "User successfully Fetched .", "success": true })
  } else {
    res.json({ "message": "Oops! An error occurred.", "success": false })
  }
})

app.put('/prisma/lalasa/shop', async (req, res) => {
  await executeLatinFunction()
  var name = req.body.name
  var phone = req.body.phone
  var password = req.body.password
  var address = req.body.address
  var category = req.body.category
  var rating = req.body.rating ? req.body.rating : "5"
  var latlong = req.body.latlong ? req.body.latlong : "Not Specified"
  var image = req.body.image
  var pincode = req.body.pincode
  var id = req.body.id
  if (name && phone && password && address && category && rating && latlong && image && pincode && id) {
    const result = await prisma.lalasa_shop.update({
      where: { id: Number(id) },
      data: { name: name, phone: phone, password: password, address: address, category: category, rating: rating, latlong: latlong, image: image, pincode: pincode }
    });
    if (result) {
      res.json({ "message": "Shop successfully updated.", "success": true });
    } else {
      res.json({ "message": "Error.", "success": false });
    }
  } else {
    res.json({ "message": "Required fields missing", "success": false });
  }
})


app.get('/prisma/lalasa/pet', async (req, res) => {
  await executeLatinFunction()

  var shopName = new Map();

  (await prisma.lalasa_shop.findMany()).forEach(element => {
    shopName.set(element.id + "", element.name)
  });
  var shopId = req.query.shopId
  var shop = (shopId.toString().split(","))
  const result = (await prisma.lalasa_banner.findMany({
    where: shopId ? { shopId: { in: shop } } : {}
  })).map(function (val, index) {
    return {
      "id": val.id, "shopId": val.shopId, "image": val.image,
      "title": val.title, "offer": val.offer,
      "shopName": shopName.has(val.shopId + "") ? shopName.get(val.shopId + "") : "NA"
    }
  });
  res.json({ "data": result, "message": "Sucessfully Fetched.", "success": true });
})

app.post('/prisma/lalasa/otp', async (req, res) => {
  await executeLatinFunction()
  var phone = req.body.phone
  var otp = Math.floor(1000 + Math.random() * 9000);
  if (phone) {
    const result = await prisma.lalasa_user.findFirst({
      where: { OR: [{ phone: phone }, { email: phone }] },
    });
    if (result) {
      const resultUpdate = await prisma.lalasa_user.updateMany({
        where: { OR: [{ phone: phone }, { email: phone }] },
        data: { otp: otp + "" }
      });
      if (result) {
        var mailOptions = {
          from: 'networksoftwaresolution@gmail.com',
          to: result.email,
          subject: "Welcome to LALASA",
          text: subject.replace('***', otp + "").replace('#', result.email).replace('**', result.name).replace("*", result.name)
        };
        sendmail(mailOptions)
        res.json({ "otp": result.otp, "message": "otp Sucessfully sent.", "success": true });
      }
    } else {
      res.json({ "message": "User not found.", "success": false });
    }
  } else {
    res.json({ "message": "Required fields missing", "success": false });
  }
})

app.post('/prisma/lalasa/reset_password', async (req, res) => {
  await executeLatinFunction()
  var newpw = req.body.newpw
  var phone = req.body.phone
  var otp = req.body.otp
  if (newpw && phone && otp) {
    const result = await prisma.lalasa_user.findFirst({
      where: { AND: [{ OR: [{ phone: phone }, { email: phone }] }, { otp: otp }] },
    })
    if (result) {
      const resultNew = await prisma.lalasa_user.updateMany({
        where: { OR: [{ phone: phone }, { email: phone }] },
        data: { password: newpw, otp: otp + "" }
      });
      if (result) {
        res.json({ "message": "Password Change Sucessfully.", "success": true });
      } else {
        res.json({ "message": "Oops! An error occurred.", "success": false });
      }
    } else {
      res.json({ "message": "No user Exsists.", "success": false });
    }
  }
})

app.put('/prisma/lalasa/changepassword', async (req, res) => {
  await executeLatinFunction()
  var oldpw = req.body.oldpw
  var newpw = req.body.newpw
  var phone = req.body.phone
  if (oldpw && newpw && phone) {
    const result = await prisma.lalasa_user.findFirst({
      where: { AND: [{ phone: phone }, { password: oldpw }] }
    });
    if (result) {
      const resultUser = await prisma.lalasa_user.updateMany({
        where: { phone: phone },
        data: { password: newpw }
      });

      if (resultUser) {
        res.json({
          "message": "Password Change Sucesssfully ", "success": true
        })
      } else {
        res.json({ "message": "Oops! An error occurred.", "success": false })
      }
    } else {
      res.json({ "message": "No User Exist", "success": false })
    }
  } else {
    res.json({ "message": "Required fields missing", "success": false });
  }
})

app.post('/prisma/lalasa/pets', async (req, res) => {
  await executeLatinFunction()
  var name = req.body.name
  var type = req.body.type
  var image = req.body.image
  var breed = req.body.breed ? breed = req.body.breed : "Not Specified"
  var dob = req.body.dob ? req.body.dob : "Not Specified"
  var gender = req.body.gender ? req.body.gender : "Not Specified"
  var weight = req.body.weight ? req.body.weight : "Not Specified"
  var description = req.body.description
  var freedelivery = req.body.freedelivery ? req.body.freedelivery : "0"
  var rating = req.body.rating ? req.body.rating : "5"
  var offer = req.body.offer ? req.body.offer : "0"
  var age = req.body.age ? req.body.offer : "Not Specified"
  var price = req.body.price ? req.body.price : "0"
  var strikePrice = req.body.strikePrice ? req.body.strikePrice : "0"
  var bestSelling = req.body.bestSelling ? req.body.bestSelling : "0"
  var userId = req.body.userId ? req.body.userId : "Not Specified"
  var shopId = req.body.shopId ? req.body.shopId : "Not Specified"
  var isAdopt = req.body.isAdopt ? req.body.isAdopt : "0"
  var category = req.body.category ? req.body.category : "Not Specified"
  var shopType = req.body.shopType ? req.body.shopType : "Not Specified"
  var quantity = req.body.quantity ? req.body.quantity : "1"
  var pincode = req.body.pincode ? req.body.pincode : "641001"
  var petSize = req.body.petSize ? req.body.petSize : "Not Specified"
  var petAgressive = req.body.petAgressive ? req.body.petAgressive : "Not Specified"
  var priceRange = req.body.priceRange ? req.body.priceRange : "[]"
  var discount = req.body.discount ? req.body.discount : "NA"
  if (name && type && image && breed && dob && gender && weight && description && freedelivery && rating && offer && age && price && strikePrice && bestSelling && userId && shopId && isAdopt && category && shopType && quantity && pincode) {
    const result = await prisma.lalasa_pets.create({
      data: {
        name: name, type: type, image: image, breed: breed, dob: dob, gender: gender, weight: weight, description: description, freedelivery: freedelivery, rating: rating, offer: offer, age: age, price: price, strikePrice: strikePrice,
        bestSelling: bestSelling, userId: userId, shopId: shopId, isAdopt: isAdopt, category: category, shopType: shopType, quantity: quantity, pincode: pincode, petSize: petSize, petAgressive: petAgressive, priceRange: priceRange, discount: discount
      }
    });
    if (result) {
      res.json({ "message": "Pet/Product successfully created.", "success": true });
    } else {
      res.json({ "message": "Error.", "success": false });
    }
  } else {
    res.json({ "message": "Required fields missing", "success": false });
  }
})

app.put('/prisma/lalasa/pets', async (req, res) => {
  await executeLatinFunction()
  var name = req.body.name
  var type = req.body.type
  var image = req.body.image
  var breed = req.body.breed ? breed = req.body.breed : "Not Specified"
  var dob = req.body.dob ? req.body.dob : "Not Specified"
  var gender = req.body.gender ? req.body.gender : "Not Specified"
  var weight = req.body.weight ? req.body.weight : "Not Specified"
  var description = req.body.description
  var freedelivery = req.body.freedelivery ? req.body.freedelivery : "0"
  var rating = req.body.rating ? req.body.rating : "5"
  var offer = req.body.offer ? req.body.offer : "0"
  var age = req.body.age ? req.body.age : "Not Specified"
  var price = req.body.price ? req.body.price : "0"
  var strikePrice = req.body.strikePrice ? req.body.strikePrice : "0"
  var bestSelling = req.body.bestSelling ? req.body.bestSelling : "0"
  var userId = req.body.userId ? req.body.userId : "Not Specified"
  var shopId = req.body.shopId ? req.body.shopId : "Not Specified"
  var isAdopt = req.body.isAdopt ? req.body.isAdopt : "0"
  var category = req.body.category ? req.body.category : "Not Specified"
  var shopType = req.body.shopType ? req.body.shopType : "Not Specified"
  var quantity = req.body.quantity ? req.body.quantity : "1"
  var pincode = req.body.pincode ? req.body.pincode : "641001"
  var petSize = req.body.petSize ? req.body.petSize : "Not Specified"
  var petAgressive = req.body.petAgressive ? req.body.petAgressive : "Not Specified"
  var priceRange = req.body.priceRange ? req.body.priceRange : "[]"
  var discount = req.body.discount ? req.body.discount : "NA"
  var id = req.body.id
  if (name && type && image && breed && dob && gender && weight && description && freedelivery && rating && offer && age && price && strikePrice && bestSelling && userId && shopId && isAdopt && category && shopType && quantity && pincode && id) {
    const result = await prisma.lalasa_pets.update({
      where: { id: Number(id) },
      data: {
        name: name, type: type, image: image, breed: breed, dob: dob, gender: gender, weight: weight, description: description, freedelivery: freedelivery, rating: rating, offer: offer, age: age, price: price, strikePrice: strikePrice,
        bestSelling: bestSelling, userId: userId, shopId: shopId, isAdopt: isAdopt, category: category, shopType: shopType, quantity: quantity, pincode: pincode, petSize: petSize, petAgressive: petAgressive, priceRange: priceRange, discount: discount
      }
    });
    if (result) {
      res.json({ "message": "Pet/Product successfully updated.", "success": true });
    } else {
      res.json({ "message": "Error.", "success": false });
    }
  } else {
    res.json({ "message": "Required fields missing", "success": false });
  }
})

app.get('/prisma/lalasa/pets', async (req, res) => {
  await executeLatinFunction()
  var userId = req.query.userId
  var isAdopt = req.query.isAdopt
  var bestSelling = req.query.bestSelling
  var shopping = req.query.shopping
  var shopId = req.query.shopId
  var shopType = req.query.shopType
  var user = req.query.user
  var pincode = req.query.pincode
  var ids = req.query.ids
  if (ids != undefined) {
    var shopIds = (ids.toString().split(","))
  }
  const result = await prisma.lalasa_pets.findMany({
    where: { AND: [isAdopt ? { isAdopt: isAdopt + "" } : {}, userId ? { userId: { not: userId + "" } } : {}, user ? { userId: user + "" } : {}, bestSelling ? { bestSelling: bestSelling + "" } : {}, shopping ? { shopType: shopping + "" } : {}, shopId ? { shopId: shopId + "" } : {}, shopType ? { shopType: shopType + "" } : {}, ids ? { shopId: { in: shopIds } } : {}, pincode ? { pincode: pincode + "" } : {}] },
    orderBy: { id: "desc" }
  })
  if (result) {
    res.json({ "data": result, "success": true });
  } else {
    res.json({ "message": "No Pets found.", "success": false });
  }
})

app.get('/prisma/lalasa/partner_get', async (req, res) => {
  await executeLatinFunction()
  var userId = req.query.userId
  var gender = req.query.gender
  var type = req.query.type
  const result = await prisma.lalasa_pets.findMany({
    where: {
      AND: [{ userId: { not: userId + "" } }, { shopType: "Pet" }, { gender: { not: gender + "" } }, { type: type + "" }]
    }
  })
  if (result) {
    res.json({ "data": result, "success": true });
  } else {
    res.json({ "message": "No Pets found.", "success": false });
  }
})

app.delete('/prisma/lalasa/pets', async (req, res) => {
  await executeLatinFunction()
  var id = req.query.id
  if (id) {
    const result = await prisma.lalasa_pets.deleteMany({
      where: { id: Number(id) }
    });
    if (result) {
      res.json({ "message": "Pet/Product successfully deleted.", "success": true });
    } else {
      res.json({ "message": "No Pet/Product found.", "success": false });
    }
  } else {
    res.json({ "message": "Required fields missing", "success": false });
  }
})

app.post('/prisma/lalasa/banner', async (req, res) => {
  await executeLatinFunction()
  var shopId = req.body.shopId
  var image = req.body.image
  var title = req.body.title
  var offer = req.body.offer
  if (image && title && offer) {
    const result = await prisma.lalasa_banner.create({
      data: { image: image, title: title, offer: offer, shopId: shopId }
    });
    if (result) {
      res.json({ "message": "Banner successfully created.", "success": true })
    } else {
      res.json({ "message": "Oops! An error occurred.", "success": false })
    }
  } else {
    res.json({ "message": "Required fields missing", "success": false });
  }
})

app.get('/prisma/lalasa/banner', async (req, res) => {
  await executeLatinFunction()

  var shopName = new Map();

  (await prisma.lalasa_shop.findMany()).forEach(element => {
    shopName.set(element.id + "", element.name)
  });
  var shopId = req.query.shopId
  var shop = (shopId.toString().split(","))
  const result = (await prisma.lalasa_banner.findMany({
    where: shopId ? { shopId: { in: shop } } : {}
  })).map(function (val, index) {
    return {
      "id": val.id, "shopId": val.shopId, "image": val.image,
      "title": val.title, "offer": val.offer,
      "shopName": shopName.has(val.shopId + "") ? shopName.get(val.shopId + "") : "NA"
    }
  });
  res.json({ "data": result, "message": "Sucessfully Fetched.", "success": true });
})

app.delete('/prisma/lalasa/banner', async (req, res) => {
  await executeLatinFunction()
  var id = req.query.id
  if (id) {
    const result = await prisma.lalasa_banner.delete({
      where: { id: Number(id) }
    });
    if (result) {
      res.json({ "message": "Banner successfully deleted.", "success": true });
    } else {
      res.json({ "message": "No Banners found.", "success": false });
    }
  } else {
    res.json({ "message": "Required fields missing", "success": false });
  }
})

app.post('/prisma/lalasa/address', async (req, res) => {
  await executeLatinFunction()
  var name = req.body.name
  var phone = req.body.phone
  var city = req.body.city
  var zipcode = req.body.zipcode
  var address = req.body.address
  var place = req.body.place
  var userId = req.body.userId
  if (name && phone && city && zipcode && address && place && userId) {
    const result = await prisma.lalasa_address.create({
      data: { name: name, phone: phone, city: city, zipcode: zipcode, address: address, place: place, userId: userId }
    });
    if (result) {
      res.json({ "message": "Address successfully created.", "success": true })
    } else {
      res.json({ "message": "Oops! An error occurred.", "success": false })
    }
  } else {
    res.json({ "message": "Required fields missing", "success": false });
  }
})

app.put('/prisma/lalasa/address', async (req, res) => {
  await executeLatinFunction()
  var name = req.body.name
  var phone = req.body.phone
  var city = req.body.city
  var zipcode = req.body.zipcode
  var address = req.body.address
  var userId = req.body.userId
  var id = req.body.id
  if (name && phone && city && zipcode && address && userId && id) {
    const result = await prisma.lalasa_address.updateMany({
      where: { id: Number(id) },
      data: { name: name, phone: phone, city: city, zipcode: zipcode, address: address, userId: userId }
    });
    if (result) {
      res.json({ "message": "Address successfully updated.", "success": true })
    } else {
      res.json({ "message": "Oops! An error occurred.", "success": false })
    }
  } else {
    res.json({ "message": "Required fields missing", "success": false });
  }
})

app.get('/prisma/lalasa/address', async (req, res) => {
  await executeLatinFunction()
  var userId = req.query.userId
  var id = req.query.id
  const result = await prisma.lalasa_address.findMany({
    where: { AND: [userId ? { userId: userId + "" } : {}, id ? { id: Number(id) } : {}] },
    orderBy: { id: "desc" }
  });
  res.json({ "data": result, "message": "Sucessfully Fetched.", "success": true });
})

app.delete('/prisma/lalasa/address', async (req, res) => {
  await executeLatinFunction()
  var id = req.query.id
  if (id) {
    const result = await prisma.lalasa_address.delete({
      where: { id: Number(id) }
    });
    if (result) {
      res.json({ "message": "Address successfully deleted.", "success": true });
    } else {
      res.json({ "message": "No Address found.", "success": false });
    }
  } else {
    res.json({ "message": "Required fields missing", "success": false });
  }
})

app.post('/prisma/lalasa/treatment', async (req, res) => {
  await executeLatinFunction()
  var image = req.body.image
  var type = req.body.type
  var description = req.body.description
  var price = req.body.price
  if (image && type && description && price) {
    const result = await prisma.lalasa_treatment.create({
      data: { type: type, description: description, price: price, image: image }
    });
    if (result) {
      res.json({ "message": "Treatment successfully created.", "success": true })
    } else {
      res.json({ "message": "Oops! An error occurred.", "success": false })
    }
  } else {
    res.json({ "message": "Required fields missing", "success": false });
  }
})

app.put('/prisma/lalasa/treatment', async (req, res) => {
  await executeLatinFunction()
  var image = req.body.image
  var type = req.body.type
  var description = req.body.description
  var price = req.body.price
  var id = req.body.id
  if (image && type && description && price && id) {
    const result = await prisma.lalasa_treatment.updateMany({
      where: { id: Number(id) },
      data: { type: type, description: description, price: price, image: image }
    });
    if (result) {
      res.json({ "message": "Treatment successfully updated.", "success": true })
    } else {
      res.json({ "message": "Oops! An error occurred.", "success": false })
    }
  } else {
    res.json({ "message": "Required fields missing", "success": false });
  }
})

app.get('/prisma/lalasa/treatment', async (req, res) => {
  await executeLatinFunction()
  var type = req.query.type
  const result = await prisma.lalasa_treatment.findMany({
    where: type ? { type: type + "" } : {},
    orderBy: { id: "desc" }
  });
  res.json({ "data": result, "message": "Sucessfully Fetched.", "success": true });
})

app.delete('/prisma/lalasa/treatment', async (req, res) => {
  await executeLatinFunction()
  var id = req.query.id
  if (id) {
    const result = await prisma.lalasa_treatment.delete({
      where: { id: Number(id) }
    });
    if (result) {
      res.json({ "message": "Treatment successfully deleted.", "success": true });
    } else {
      res.json({ "message": "No treatment found.", "success": false });
    }
  } else {
    res.json({ "message": "Required fields missing", "success": false });
  }
})

app.post('/prisma/lalasa/order', async (req, res) => {
  await executeLatinFunction()
  var userId = req.body.userId
  var petId = req.body.petId
  var price = req.body.price
  var serviceType = req.body.serviceType
  var date = req.body.date
  var time = req.body.time
  var address = req.body.address
  var payMethods = req.body.payMethods
  var promoCode = req.body.promoCode
  var offerAmt = req.body.offerAmt ? req.body.offerAmt : "0"
  var subTotal = req.body.subTotal ? req.body.subTotal : "0"
  var shippingFee = req.body.shippingFee ? req.body.shippingFee : "0"
  var tax = req.body.tax ? req.body.tax : "0"
  var grandTotal = req.body.grandTotal ? req.body.grandTotal : "0"
  var review = req.body.review ? req.body.review : "Not Specified"
  var rating = req.body.rating ? req.body.rating : "5"
  var orderType = req.body.orderType
  var status = req.body.status ? req.body.status : "ordered"
  var orderItems = req.body.orderItems ? req.body.orderItems : "1"
  var reason = req.body.reason
  var paymentId = req.body.paymentId
  var assignShop = req.body.assignShop ? req.body.assignShop : "Not Specified"
  var items = req.body.items
  var sbId = req.body.sbId ? req.body.sbId : "NA"
  if (userId && petId && price && serviceType && date && address && payMethods && promoCode && offerAmt && subTotal && shippingFee && tax && grandTotal && review && rating && orderType && status && paymentId && reason && items) {
    const result = await prisma.lalasa_order.create({
      data: {
        userId: userId, petId: petId, price: price, serviceType: serviceType, date: date, time: time, address: address, payMethods: payMethods, promoCode: promoCode, offerAmt: offerAmt, reason: reason,
        subTotal: subTotal, shippingFee: shippingFee, tax: tax, grandTotal: grandTotal, review: review, rating: rating, orderType: orderType, status: status, paymentId: paymentId, assignShop: assignShop, items: items, sbId: sbId
      }
    });
    var orderId = String(result.id);
    const resultUpdate = await prisma.track_order.create({
      data: { orderId: orderId, status: "ordered", orderItems: orderItems, description: reason }
    })
    if (result) {
      if (orderType == "Grooming") {
        pushNotification(orderType + ' Service', "New Service available", "key=" + sbKey, '/topics/allDevices')
      } else {
        res.json({ "orderId": orderId, "message": "Order successfully created.", "success": true })
      }
    } else {
      res.json({ "message": "Oops! An error occurred.", "success": false })
    }
  } else {
    res.json({ "message": "Required fields missing", "success": false });
  }
})

app.put('/prisma/lalasa/order', async (req, res) => {
  await executeLatinFunction()
  var userId = req.body.userId
  var review = req.body.review ? req.body.review : "Not Specified"
  var rating = req.body.rating ? req.body.rating : "5"
  var orderId = req.body.orderId
  if (userId && review && rating) {
    const result = await prisma.lalasa_order.updateMany({
      where: { id: Number(orderId) },
      data: { userId: userId, review: review, rating: rating }
    });
    if (result) {
      res.json({ "message": "Review successfully updated.", "success": true })
    } else {
      res.json({ "message": "Oops! An error occurred.", "success": false })
    }
  } else {
    res.json({ "message": "Required fields missing", "success": false });
  }
})

app.put('/prisma/lalasa/assign_service', async (req, res) => {
  await executeLatinFunction()
  var sbId = req.body.sbId
  var status = req.body.status
  var orderId = req.body.orderId
  if (sbId && orderId && status) {
    const result = await prisma.lalasa_order.updateMany({
      where: { id: Number(orderId) },
      data: { sbId: sbId, status: status }
    });
    if (result) {
      const resultupdate = await prisma.lalasa_order.findFirst({
        where: { id: Number(orderId) },
      });
      pushNotification(resultupdate.orderType + ' Service', "New Service available", "key=" + sbKey, '/topics/allDevices_' + resultupdate.sbId)
      res.json({ "message": "Service Boy status successfully updated.", "success": true })
    } else {
      res.json({ "message": "Oops! An error occurred.", "success": false })
    }
  } else {
    res.json({ "message": "Required fields missing", "success": false });
  }
})

app.get('/prisma/lalasa/getorder', async (req, res) => {
  await executeLatinFunction()
  var orderType = req.query.orderType
  var status = req.query.status
  var sbId = req.query.sbId
  const result = await prisma.lalasa_order.findMany({
    where: {
      OR: [
        status == "progress" ? { AND: [{ NOT: [{ status: "ordered" }, { status: "completed" }, { status: "cancelled" }] }, { orderType: orderType + "" }] } : { AND: [orderType ? { orderType: orderType + "" } : {}, status ? { status: status + "" } : {}, sbId ? { sbId: sbId + "" } : {}] }
      ]
    },
    orderBy: { id: "desc" }
  });
  res.json({ "data": result, "message": "Sucessfully Fetched.", "success": true });
})

app.get('/prisma/lalasa/order', async (req, res) => {
  await executeLatinFunction()

  var UserName = new Map();
  var UserPhone = new Map();
  var petName = new Map();
  var shopName = new Map();
  var addressName = new Map();
  var sbName = new Map();

  (await prisma.lalasa_user.findMany()).forEach(element => {
    UserName.set(element.id + "", element.name)
    UserPhone.set(element.id + "", element.phone)
  });

  (await prisma.lalasa_pets.findMany()).forEach(element => {
    petName.set(element.id + "", element.name)
  });

  (await prisma.lalasa_shop.findMany()).forEach(element => {
    shopName.set(element.id + "", element.name)
  });

  (await prisma.lalasa_address.findMany()).forEach(element => {
    addressName.set(element.id + "", element.address)
  });

  (await prisma.lalasa_serviceboy.findMany()).forEach(element => {
    sbName.set(element.id + "", element.firstName)
  });

  var assignShop = req.query.assignShop
  var orderType = req.query.orderType
  var userId = req.query.userId
  const result = await Promise.all(await (await prisma.lalasa_order.findMany({
    where: { AND: [assignShop && assignShop != "All" ? { assignShop: assignShop + "" } : {}, orderType ? { orderType: orderType + "" } : {}, , userId ? { userId: userId + "" } : {}] },
    orderBy: { id: "desc" }
  })).map(async function (val, index) {

    const resultUpdate = await prisma.track_order.findMany({
      where: { orderId: val.id + "" }
    })

    return {
      "id": val.id, "userId": val.userId, "petId": val.petId,
      "price": val.price, "serviceType": val.serviceType, "date": val.date, "time": val.time,
      "address": val.address, "payMethods": val.payMethods, "promoCode": val.promoCode,
      "offerAmt": val.offerAmt, "subTotal": val.subTotal, "shippingFee": val.shippingFee, "tax": val.tax, "paymentId": val.paymentId, "reason": val.reason, "items": val.items, "sbId": val.sbId,
      "grandTotal": val.grandTotal, "assignShop": val.assignShop, "review": val.review, "rating": val.rating, "orderType": val.orderType, "status": val.status, "createdOn": val.createdOn,
      "UserName": UserName.has(val.userId) ? UserName.get(val.userId) : "NA",
      "UserPhone": UserPhone.has(val.userId) ? UserPhone.get(val.userId) : "NA",
      "petName": petName.has(val.petId + "") ? petName.get(val.petId + "") : "NA",
      "shopName": shopName.has(val.assignShop + "") ? shopName.get(val.assignShop + "") : "NA",
      "addressName": addressName.has(val.address + "") ? addressName.get(val.address + "") : "NA",
      "serviceboyName": sbName.has(val.sbId + "") ? sbName.get(val.sbId + "") : "NA",
      "trackOrder": resultUpdate
    }

  }));
  res.json({ "data": result, "message": "Sucessfully Fetched.", "success": true });
})

app.get('/prisma/lalasa/order_report', async (req, res) => {
  await executeLatinFunction()
  var Adoption = 0;
  var PetTraining = 0;
  var Grooming = 0;
  var PetHotel = 0;
  var Accessories = 0;
  var Veterinarian = 0;
  var Restaurant = 0;
  var Pet = 0;
  var userId = req.query.userId

  const result = (await prisma.lalasa_order.findMany({
    where: userId ? { assignShop: userId + "" } : {},
    orderBy: { id: "desc" }
  })).map(async function (val, index) {
    if (val.orderType == 'Adoption') {
      Adoption += 1
    } else if (val.orderType == 'Pet Training') {
      PetTraining++;
    } else if (val.orderType == 'Grooming') {
      Grooming++;
    } else if (val.orderType == 'Hotel Care') {
      PetHotel++;
    } else if (val.orderType == 'Accessories') {
      Accessories++;
    } else if (val.orderType == 'Veterinarian') {
      Veterinarian++;
    } else if (val.orderType == 'Restaurant') {
      Restaurant++;
    } else if (val.orderType == 'Pet') {
      Pet++;
    }
    return {

    }
  });
  res.json({
    "Adoption": Adoption, "PetTraining": PetTraining, "Grooming": Grooming,
    "PetHotel": PetHotel, "Accessories": Accessories, "Veterinarian": Veterinarian, "Restaurant": Restaurant,
    "Pet": Pet, "totalorder": result.length, "message": "Sucessfully Fetched.", "success": true
  });
})

app.get('/prisma/lalasa/product_report', async (req, res) => {
  await executeLatinFunction()
  var Adoption = 0;
  var Accessories = 0;
  var Pet = 0;
  var Restaurant = 0;
  var userId = req.query.userId
  const result = (await prisma.lalasa_pets.findMany({
    where: userId ? { shopId: userId + "" } : {},
    orderBy: { id: "desc" }
  })).map(async function (val, index) {
    if (val.shopType == 'Adoption') {
      Adoption += 1
    } else if (val.shopType == 'Accessories') {
      Accessories++;
    } else if (val.shopType == 'Pet') {
      Pet++;
    } else if (val.shopType == 'Restaurant') {
      Restaurant++;
    }
    return {

    }
  });
  res.json({
    "Adoption": Adoption, "Accessories": Accessories, "Pet": Pet, "Restaurant": Restaurant, "totalproduct": result.length,
    "message": "Sucessfully Fetched.", "success": true
  });
})

app.get('/prisma/lalasa/order_count', async (req, res) => {
  await executeLatinFunction()
  var ordered = 0;
  var delivered = 0;
  var shipped = 0;
  var cancelled = 0;
  var sbassigned = 0;
  var completed = 0;
  var sbId = req.query.sbId
  var orderType = req.query.orderType
  const resultOrder = (await prisma.lalasa_order.findMany({
    where: orderType ? { orderType: orderType + "" } : {},
    orderBy: { id: "desc" }
  })).map(async function (val, index) {
    if (val.status == 'ordered') {
      ordered += 1
    }
    return {

    }
  });

  const result = (await prisma.lalasa_order.findMany({
    where: { AND: [sbId ? { sbId: sbId + "" } : {}, orderType ? { orderType: orderType + "" } : {}] },
    orderBy: { id: "desc" }
  })).map(async function (val, index) {
    if (val.status == 'delivered') {
      delivered++;
    } else if (val.status == 'shipped') {
      shipped++;
    } else if (val.status == 'cancelled') {
      cancelled++;
    } else if (val.status == 'service boy assigned') {
      sbassigned++;
    } else if (val.status == 'completed') {
      completed++;
    }
    return {

    }
  });
  res.json({
    "ordered": ordered + '', "delivered": delivered + '', "shipped": shipped + '', "cancelled": cancelled + '', "completed": completed + '', "sbassigned": sbassigned + '',
    "totalorder": result.length + '', "message": "Sucessfully Fetched.", "success": true
  });
})

app.delete('/prisma/lalasa/order', async (req, res) => {
  await executeLatinFunction()
  var id = req.query.id
  if (id) {
    const result = await prisma.lalasa_order.delete({
      where: { id: Number(id) }
    });
    if (result) {
      res.json({ "message": "order successfully deleted.", "success": true });
    } else {
      res.json({ "message": "No order found.", "success": false });
    }
  } else {
    res.json({ "message": "Required fields missing", "success": false });
  }
})

app.post('/prisma/lalasa/track_order_id', async (req, res) => {
  await executeLatinFunction()
  var id = req.body.id
  const result = (await prisma.track_order.findMany({
    where: id ? { orderId: String(id) } : {},
    orderBy: { id: "asc" }
  })).map(function (val, index) {
    var cuarrentdate = moment.tz(val.createdOn, "MST").format()
    let dateInMyTimeZone = moment.tz(cuarrentdate, "Asia/Kolkata").format("DD-MM-YYYY HH:mm:ss");
    return {
      "id": val.id, "status": val.status, "description": val.description, "createdOn": dateInMyTimeZone,
    }
  });
  if (result) {
    res.json({ "data": result, "message": "Successfully Fetched.", "success": true });
  } else {
    res.json({ "message": "No Product found.", "success": false });
  }
})

app.post('/prisma/lalasa/paycard', async (req, res) => {
  await executeLatinFunction()
  var userId = req.body.userId
  var cardNo = req.body.cardNo
  var holderName = req.body.holderName
  var expDate = req.body.expDate
  var cvv = req.body.cvv
  if (userId && cardNo && holderName && expDate && cvv) {
    const result = await prisma.lalasa_paycard.create({
      data: { userId: userId, cardNo: cardNo, holderName: holderName, expDate: expDate, cvv: cvv }
    });
    if (result) {
      res.json({ "message": "Paycard successfully created.", "success": true })
    } else {
      res.json({ "message": "Oops! An error occurred.", "success": false })
    }
  } else {
    res.json({ "message": "Required fields missing", "success": false });
  }
})

app.get('/prisma/lalasa/paycard', async (req, res) => {
  await executeLatinFunction()
  var userId = req.query.userId
  const result = await prisma.lalasa_paycard.findMany({
    where: userId ? { userId: userId + "" } : {},
    orderBy: { id: "desc" }
  });
  res.json({ "data": result, "message": "Sucessfully Fetched.", "success": true });
})

app.delete('/prisma/lalasa/paycard', async (req, res) => {
  await executeLatinFunction()
  var id = req.query.id
  if (id) {
    const result = await prisma.lalasa_paycard.delete({
      where: { id: Number(id) }
    });
    if (result) {
      res.json({ "message": "Paycard successfully deleted.", "success": true });
    } else {
      res.json({ "message": "No paycard found.", "success": false });
    }
  } else {
    res.json({ "message": "Required fields missing", "success": false });
  }
})

app.put('/prisma/lalasa/shop_update', async (req, res) => {
  await executeLatinFunction()
  var status = req.body.status
  var id = req.body.id
  if (status && id) {
    const result = await prisma.lalasa_shop.updateMany({
      where: { id: Number(id) },
      data: { status: status }
    });
    if (result) {
      res.json({ "message": "Status successfully updated.", "success": true })
    } else {
      res.json({ "message": "Oops! An error occurred.", "success": false })
    }
  } else {
    res.json({ "message": "Required fields missing", "success": false });
  }
})

app.put('/prisma/lalasa/assign_shop', async (req, res) => {
  await executeLatinFunction()
  var id = req.body.id
  var assignShop = req.body.assignShop
  var status = req.body.status
  if (id && assignShop) {
    const result = await prisma.lalasa_order.update({
      where: { id: Number(id) },
      data: { assignShop: assignShop, status: status, reason: status + " " + "by admin" }
    });
    const resultUpdate = await prisma.track_order.create({
      data: { orderId: id, status: status, description: status + " " + "by admin" }
    })
    if (result) {
      res.json({ "message": "Status successfully updated.", "success": true });
    } else {
      res.json({ "message": "Error.", "success": false });
    }
  } else {
    res.json({ "message": "Required fields missing", "success": false });
  }
})

app.get('/prisma/lalasa/shop', async (req, res) => {
  await executeLatinFunction()
  var orderType = req.query.orderType
  var pincode = req.query.pincode
  const result = await prisma.lalasa_shop.findMany({
    where: pincode ? {
      OR: [{
        AND: [orderType ? { category: { contains: orderType + "" } } : {}, pincode ? { pincode: pincode + "" } : {}]
      }, { role: 'SAdmin' }]
    } : {},
    orderBy: { id: "desc" }
  });
  res.json({ "data": result, "message": "Sucessfully Fetched.", "success": true });
})

app.post('/prisma/lalasa/fetchShopByIds', async (req, res) => {
  await executeLatinFunction()
  var id = req.body.id
  const result = await prisma.lalasa_shop.findMany({
    where: { id: { in: id } }
  });
  res.json({ "data": result, "success": true, "message": "Successfully Fetched." });
})

app.delete('/prisma/lalasa/shop', async (req, res) => {
  await executeLatinFunction()
  var id = req.query.id
  var isDelete = req.query.isDelete
  if (id) {
    const result = await prisma.lalasa_shop.update({
      where: { id: Number(id) },
      data: { isDelete: isDelete + "" }
    });
    if (result) {
      res.json({ "message": "Shop successfully updated.", "success": true });
    } else {
      res.json({ "message": "No Shop found.", "success": false });
    }
  } else {
    res.json({ "message": "Required fields missing", "success": false });
  }
})

app.post('/prisma/lalasa/coupon', async (req, res) => {
  await executeLatinFunction()
  var offercode = req.body.offercode
  var description = req.body.description
  var title = req.body.title
  var isPercent = req.body.isPercent
  var value = req.body.value
  var status = req.body.status ? req.body.status : "0"
  var maxNumber = req.body.maxNumber ? req.body.maxNumber : "1"
  var minOrder = req.body.minOrder ? req.body.minOrder : "100"
  var offerType = req.body.offerType
  var shopId = req.body.shopId
  if (offercode && description && title && isPercent && value && status && maxNumber && minOrder && offerType && shopId) {
    const result = await prisma.lalasa_coupon.create({
      data: { offercode: offercode, description: description, title: title, isPercent: isPercent, value: value, status: status, maxNumber: maxNumber, minOrder: minOrder, offerType: offerType, shopId: shopId }
    });
    if (result) {
      res.json({ "message": "Coupon successfully created.", "success": true })
    } else {
      res.json({ "message": "Oops! An error occurred.", "success": false })
    }
  } else {
    res.json({ "message": "Required fields missing", "success": false });
  }
})

app.put('/prisma/lalasa/coupon', async (req, res) => {
  await executeLatinFunction()
  var id = req.body.id
  var offercode = req.body.offercode
  var description = req.body.description
  var title = req.body.title
  var isPercent = req.body.isPercent
  var value = req.body.value
  var status = req.body.status ? req.body.status : "0"
  var maxNumber = req.body.maxNumber ? req.body.maxNumber : "1"
  var minOrder = req.body.minOrder ? req.body.minOrder : "100"
  var offerType = req.body.offerType
  var shopId = req.body.shopId

  if (id && offercode && description && title && isPercent && value && status && maxNumber && minOrder && offerType && shopId) {
    const result = await prisma.lalasa_coupon.updateMany({
      where: { id: Number(id) },
      data: { offercode: offercode, description: description, title: title, isPercent: isPercent, value: value, status: status, maxNumber: maxNumber, minOrder: minOrder, offerType: offerType, shopId: shopId }
    });
    if (result) {
      res.json({ "message": "Coupon successfully updated.", "success": true });
    } else {
      res.json({ "message": "Error.", "success": false });
    }
  } else {
    res.json({ "message": "Required fields missing", "success": false });
  }
})

app.get('/prisma/lalasa/getcoupon', async (req, res) => {
  await executeLatinFunction()
  var offercode = req.query.offercode ? req.query.offercode : "NA"
  var userId = req.query.userId
  if (offercode && userId) {
    const result = await prisma.lalasa_coupon.findFirst({
      where: { AND: [{ offercode: offercode + "" }, { status: "1" }] },
    });
    if (result) {
      const resultOrder = await prisma.lalasa_order.count({
        where: { promoCode: offercode + "", userId: userId + "" }
      })
      if (resultOrder >= Number(result.maxNumber)) {
        res.json({ "message": "Coupon already used.", "success": false });
      } else {
        res.json({ "offerType": result.offerType, "offercode": result.offercode, "value": result.value, "isPercent": result.isPercent, "miniorder": result.minOrder, "maxNumber": result.maxNumber, "shopId": result.shopId, "message": "Congrats, Successfully Applied.", "success": true });
      }
    } else {
      res.json({ "message": "Coupon Not valid.", "success": false });
    }
  }
})

app.get('/prisma/lalasa/coupon', async (req, res) => {
  await executeLatinFunction()

  var shopName = new Map();

  (await prisma.lalasa_shop.findMany()).forEach(element => {
    shopName.set(element.id + "", element.name)
  });

  var shopId = req.query.shopId
  var shop = (shopId.toString().split(","))
  const result = (await prisma.lalasa_coupon.findMany({
    where: shopId && shopId != "All" ? { shopId: { in: shop } } : {},
    orderBy: { id: "desc" }
  })).map(function (val, index) {
    return {
      "id": val.id, "offercode": val.offercode, "description": val.description,
      "title": val.title, "isPercent": val.isPercent, "value": val.value, "status": val.status,
      "maxNumber": val.maxNumber, "minOrder": val.minOrder, "offerType": val.offerType, "shopId": val.shopId,
      "createdOn": val.createdOn, "shopName": shopName.has(val.shopId + "") ? shopName.get(val.shopId + "") : "NA"
    }
  });
  res.json({ "data": result, "message": "Sucessfully Fetched.", "success": true });
})
app.delete('/prisma/lalasa/coupon', async (req, res) => {
  await executeLatinFunction()
  var id = req.query.id
  if (id) {
    const result = await prisma.lalasa_coupon.delete({
      where: { id: Number(id) }
    });
    if (result) {
      res.json({ "message": "Coupon successfully deleted.", "success": true });
    } else {
      res.json({ "message": "No coupon found.", "success": false });
    }
  } else {
    res.json({ "message": "Required fields missing", "success": false });
  }
})

app.post('/prisma/lalasa/fetchProductByIds', async (req, res) => {
  await executeLatinFunction()
  var id = req.body.id
  const result = await prisma.lalasa_pets.findMany({
    where: { id: { in: id } }
  });
  res.json({ "data": result, "success": true, "message": "Successfully Fetched." });
})

app.post('/prisma/lalasa/settings', async (req, res) => {
  await executeLatinFunction()
  var config = req.body.config
  if (config) {
    const result = await prisma.lalasa_settings.updateMany({
      where: { name: "config" },
      data: { value: config }
    });
    if (result) {
      res.json({ "message": "Setting successfully updated.", "success": true })
    } else {
      res.json({ "message": "Oops! An error occurred.", "success": false })
    }
  } else {
    res.json({ "message": "Required fields missing", "success": false });
  }
})

app.get('/prisma/lalasa/settings', async (req, res) => {
  await executeLatinFunction()
  const result = await prisma.lalasa_settings.findMany({
    orderBy: { id: "desc" },
  });
  if (result) {
    res.json({ "data": result, "message": "successfully Fetched.", "success": true });
  } else {
    res.json({ "message": "No Settings found.", "success": false });
  }
})

app.post('/prisma/lalasa/review', async (req, res) => {
  await executeLatinFunction()
  var name = req.body.name
  var review = req.body.review
  var userId = req.body.userId
  if (name && review && userId) {
    const result = await prisma.lalasa_review.create({
      data: { name: name, review: review, userId: userId }
    });
    if (result) {
      res.json({ "message": "Review successfully created.", "success": true })
    } else {
      res.json({ "message": "Oops! An error occurred.", "success": false })
    }
  } else {
    res.json({ "message": "Required fields missing", "success": false });
  }
})

app.put('/prisma/lalasa/review', async (req, res) => {
  await executeLatinFunction()
  var id = req.body.id
  var name = req.body.name
  var review = req.body.review
  var userId = req.body.userId
  if (id && name && review && userId) {
    const result = await prisma.lalasa_review.updateMany({
      where: { id: Number(id) },
      data: { name: name, review: review, userId: userId }
    });
    if (result) {
      res.json({ "message": "Review successfully updated.", "success": true });
    } else {
      res.json({ "message": "Error.", "success": false });
    }
  } else {
    res.json({ "message": "Required fields missing", "success": false });
  }
})

app.get('/prisma/lalasa/review', async (req, res) => {
  await executeLatinFunction()
  var userId = req.query.userId
  const result = await prisma.lalasa_review.findMany({
    where: userId ? { userId: userId + "" } : {},
    orderBy: { id: "desc" }
  });
  res.json({ "data": result, "message": "Sucessfully Fetched.", "success": true });
})

app.delete('/prisma/lalasa/review', async (req, res) => {
  await executeLatinFunction()
  var id = req.query.id
  if (id) {
    const result = await prisma.lalasa_review.delete({
      where: { id: Number(id) }
    });
    if (result) {
      res.json({ "message": "Review successfully deleted.", "success": true });
    } else {
      res.json({ "message": "No Review found.", "success": false });
    }
  } else {
    res.json({ "message": "Required fields missing", "success": false });
  }
})

app.post('/prisma/lalasa/foodcal', async (req, res) => {
  await executeLatinFunction()
  var grams = req.body.grams
  var age = req.body.age
  var weight = req.body.weight
  if (grams && age && weight) {
    const result = await prisma.lalasa_foodcal.create({
      data: { grams: grams, age: age, weight: weight }
    });
    if (result) {
      res.json({ "message": "Food Calculator successfully created.", "success": true })
    } else {
      res.json({ "message": "Oops! An error occurred.", "success": false })
    }
  } else {
    res.json({ "message": "Required fields missing", "success": false });
  }
})

app.put('/prisma/lalasa/foodcal', async (req, res) => {
  await executeLatinFunction()
  var id = req.body.id
  var grams = req.body.grams
  var age = req.body.age
  var weight = req.body.weight
  if (id && grams && age && weight) {
    const result = await prisma.lalasa_foodcal.updateMany({
      where: { id: Number(id) },
      data: { grams: grams, age: age, weight: weight }
    });
    if (result) {
      res.json({ "message": "Food Calculator successfully updated.", "success": true });
    } else {
      res.json({ "message": "Error.", "success": false });
    }
  } else {
    res.json({ "message": "Required fields missing", "success": false });
  }
})

app.get('/prisma/lalasa/foodcal', async (req, res) => {
  await executeLatinFunction()
  var age = req.query.age
  var weight = req.query.weight
  const result = (await prisma.lalasa_foodcal.findMany({
    where: { AND: [{ age: age + "" }, { weight: weight + "" }] },
    orderBy: { id: 'asc' }
  })).map(function (val, index) {
    return val.grams
  });
  const resultage = (await prisma.lalasa_foodcal.groupBy({
    by: ['age'],
  })).map(function (val, index) {
    return val.age
  });
  const resultweight = (await prisma.lalasa_foodcal.groupBy({
    by: ['weight'],
  })).map(function (val, index) {
    return val.weight
  });
  res.json({ "grams": result, "age": resultage, "weight": resultweight, "message": "Sucessfully Fetched.", "success": true });
})

app.delete('/prisma/lalasa/foodcal', async (req, res) => {
  await executeLatinFunction()
  var id = req.query.id
  if (id) {
    const result = await prisma.lalasa_foodcal.delete({
      where: { id: Number(id) }
    });
    if (result) {
      res.json({ "message": "Food Calculator successfully deleted.", "success": true });
    } else {
      res.json({ "message": "No Foods found.", "success": false });
    }
  } else {
    res.json({ "message": "Required fields missing", "success": false });
  }
})


app.post('/prisma/lalasa/serviceboy', async (req, res) => {
  await executeLatinFunction()
  var firstName = req.body.firstName
  var lastName = req.body.lastName
  var gender = req.body.gender
  var dob = req.body.dob
  var email = req.body.email
  var phone = req.body.phone
  var alternatePh = req.body.alternatePh
  var emergencyPh = req.body.emergencyPh
  var selfiePic = req.body.selfiePic
  var bloodGroup = req.body.bloodGroup
  var password = req.body.password
  var status = req.body.status ? req.body.status : "bankDetails"
  var serviceType = req.body.serviceType
  if (firstName && lastName && gender && dob && email && phone && alternatePh && emergencyPh && selfiePic && bloodGroup && password && status) {
    const result = await prisma.lalasa_serviceboy.create({
      data: { firstName: firstName, lastName: lastName, gender: gender, dob: dob, email: email, phone: phone, alternatePh: alternatePh, emergencyPh: emergencyPh, selfiePic: selfiePic, bloodGroup: bloodGroup, password: password, status: status, serviceType: serviceType }
    });
    if (result) {
      res.json({ "data": result, "message": "Service Boy successfully created.", "success": true })
    } else {
      res.json({ "message": "Oops! An error occurred.", "success": false })
    }
  } else {
    res.json({ "message": "Required fields missing", "success": false });
  }
})

app.post('/prisma/lalasa/serviceboy_login', async (req, res) => {
  await executeLatinFunction()
  var phone = req.body.phone
  var password = req.body.password
  if (phone && password) {
    const result = await prisma.lalasa_serviceboy.findFirst({
      where: { AND: [{ OR: [{ phone: phone }, { email: phone }] }, { password: password }, { isDelete: "1" }] }
    });
    if (result) {
      res.json({ "data": result, "message": "Welcome to Service Boy.", "success": true });
    }
    else {
      res.json({ "message": "Invalid Password ", "success": false })
    }
  } else {
    res.json({ "message": "Required fields missing", "success": false });
  }
})

app.put('/prisma/lalasa/serviceboy', async (req, res) => {
  await executeLatinFunction()
  var status = req.body.status
  var accNumber = req.body.accNumber
  var ifsc = req.body.ifsc
  var pan = req.body.pan
  var aadhaar = req.body.aadhaar
  var drivingLi = req.body.drivingLi
  var voterId = req.body.voterId ? req.body.voterId : "NA"
  var passport = req.body.passport ? req.body.passport : "NA"
  var fatherName = req.body.fatherName
  var motherName = req.body.motherName
  var siblings = req.body.siblings
  var maritalStatus = req.body.maritalStatus
  var ifMarried = req.body.ifMarried
  var children = req.body.children
  var vehicle = req.body.vehicle
  var groomExperience = req.body.groomExperience ? req.body.groomExperience : "0"
  var certificate = req.body.certificate
  var groomingKit = req.body.groomingKit
  var id = req.body.id
  if (status == "bankDetails") {
    const result = await prisma.lalasa_serviceboy.update({
      where: { id: Number(id) },
      data: { accNumber: accNumber, ifsc: ifsc, pan: pan, aadhaar: aadhaar, drivingLi: drivingLi, voterId: voterId, passport: passport, status: "familyDetails" }
    });
    if (result) {
      res.json({ "data": result, "message": "Bank Details successfully updated.", "success": true })
    }
  } else if (status == "familyDetails") {
    const result = await prisma.lalasa_serviceboy.update({
      where: { id: Number(id) },
      data: {
        fatherName: fatherName, motherName: motherName, siblings: siblings, maritalStatus: maritalStatus, ifMarried: ifMarried, children: children, status: "generic"
      }
    });
    if (result) {
      res.json({ "data": result, "message": "Family Details successfully updated.", "success": true })
    }
  } else if (status == "generic") {
    const result = await prisma.lalasa_serviceboy.update({
      where: { id: Number(id) },
      data: {
        vehicle: vehicle, groomExperience: groomExperience, certificate: certificate, groomingKit: groomingKit, status: "submit"
      }
    });
    if (result) {
      res.json({ "data": result, "message": "Generic Information successfully updated.", "success": true })
    }
  }
});

app.put('/prisma/lalasa/serviceboy_update', async (req, res) => {
  await executeLatinFunction()
  var id = req.body.id
  var firstName = req.body.firstName
  var lastName = req.body.lastName
  var gender = req.body.gender
  var dob = req.body.dob
  var email = req.body.email
  var phone = req.body.phone
  var alternatePh = req.body.alternatePh
  var emergencyPh = req.body.emergencyPh
  var selfiePic = req.body.selfiePic
  var bloodGroup = req.body.bloodGroup
  var password = req.body.password
  var accNumber = req.body.accNumber
  var ifsc = req.body.ifsc
  var pan = req.body.pan
  var aadhaar = req.body.aadhaar
  var drivingLi = req.body.drivingLi
  var voterId = req.body.voterId
  var passport = req.body.passport
  var fatherName = req.body.fatherName
  var motherName = req.body.motherName
  var siblings = req.body.siblings
  var maritalStatus = req.body.maritalStatus
  var ifMarried = req.body.ifMarried
  var children = req.body.children
  var vehicle = req.body.vehicle
  var groomExperience = req.body.groomExperience
  var certificate = req.body.certificate
  var groomingKit = req.body.groomingKit
  var serviceType = req.body.serviceType
  if (id) {
    const result = await prisma.lalasa_serviceboy.update({
      where: { id: Number(id) },
      data: {
        firstName: firstName, lastName: lastName, gender: gender, dob: dob, email: email, phone: phone, alternatePh: alternatePh, emergencyPh: emergencyPh, selfiePic: selfiePic, bloodGroup: bloodGroup, password: password, status: "complete",
        accNumber: accNumber, ifsc: ifsc, pan: pan, aadhaar: aadhaar, drivingLi: drivingLi, voterId: voterId, passport: passport,
        fatherName: fatherName, motherName: motherName, siblings: siblings, maritalStatus: maritalStatus, ifMarried: ifMarried, children: children,
        vehicle: vehicle, groomExperience: groomExperience, certificate: certificate, groomingKit: groomingKit, serviceType: serviceType
      }
    });
    if (result) {
      res.json({ "data": result, "message": "Service Boy successfully updated.", "success": true });
    } else {
      res.json({ "message": "Error.", "success": false });
    }
  } else {
    res.json({ "message": "Required fields missing", "success": false });
  }
})

app.put('/prisma/lalasa/service_update', async (req, res) => {
  await executeLatinFunction()
  var id = req.body.id
  var serviceType = req.body.serviceType
  if (id) {
    const result = await prisma.lalasa_serviceboy.updateMany({
      where: { id: Number(id) },
      data: { serviceType: serviceType }
    });
    if (result) {
      res.json({ "message": "Service successfully updated.", "success": true });
    } else {
      res.json({ "message": "Error.", "success": false });
    }
  } else {
    res.json({ "message": "Required fields missing", "success": false });
  }
})

app.get('/prisma/lalasa/serviceboy', async (req, res) => {
  await executeLatinFunction()
  var id = req.query.id
  var status = req.query.status
  var serviceType = req.query.serviceType
  const result = (await prisma.lalasa_serviceboy.findMany({
    where: { AND: [id ? { id: Number(id) } : {}, status ? { status: status + "" } : {}, serviceType ? { AND: [{ serviceType: { contains: serviceType + "" } }, { isDelete: '1' }, { status: 'complete' }] } : {}] },
    orderBy: { id: "desc" }
  }))
  if (result) {
    res.json({ "data": result, "message": "Service boy successfully fetched", "success": true });
  } else {
    res.json({ "message": "No Service boy found.", "success": false });
  }
})

app.delete('/prisma/lalasa/serviceboy', async (req, res) => {
  await executeLatinFunction()
  var id = req.query.id
  var isDelete = req.query.isDelete
  if (id) {
    const result = await prisma.lalasa_serviceboy.update({
      where: { id: Number(id) },
      data: { isDelete: isDelete + "" }
    });
    if (result) {
      res.json({ "message": "Service Boy successfully updated.", "success": true });
    } else {
      res.json({ "message": "No Service Boy found.", "success": false });
    }
  } else {
    res.json({ "message": "Required fields missing", "success": false });
  }
})

app.post('/prisma/lalasa/wallet', async (req, res) => {
  await executeLatinFunction()
  var sbId = req.body.sbId
  var operation = req.body.operation
  var serviceAmt = req.body.serviceAmt
  var payMode = req.body.payMode
  var serviceType = req.body.serviceType
  var reason = req.body.reason ? req.body.reason : "NA"
  if (sbId && operation && serviceAmt && payMode && serviceType) {
    const result = await prisma.lalasa_wallet.create({
      data: { sbId: sbId, operation: operation, serviceAmt: serviceAmt, payMode: payMode, serviceType: serviceType, reason: reason }
    });
    if (result) {
      const resultupdate = await prisma.lalasa_serviceboy.update({
        where: { id: Number(sbId) },
        data: operation == 'add' ? { wallet: { increment: Number(serviceAmt) } } : { wallet: { decrement: Number(serviceAmt) } }
      });
      res.json({ "data": result, "message": "Service Boy wallet successfully created.", "success": true })
    } else {
      res.json({ "message": "Oops! An error occurred.", "success": false })
    }
  } else {
    res.json({ "message": "Required fields missing", "success": false });
  }
})

app.put('/prisma/lalasa/wallet', async (req, res) => {
  await executeLatinFunction()
  var id = req.body.id
  var sbId = req.body.sbId
  var operation = req.body.operation
  var serviceAmt = req.body.serviceAmt
  var payMode = req.body.payMode
  var serviceType = req.body.serviceType
  var reason = req.body.reason
  if (id && sbId && operation && serviceAmt && payMode && serviceType) {
    const result = await prisma.lalasa_wallet.updateMany({
      where: { id: Number(id) },
      data: { sbId: sbId, operation: operation, serviceAmt: serviceAmt, payMode: payMode, serviceType: serviceType, reason: reason }
    });
    if (result) {
      res.json({ "message": "Service Boy wallet successfully updated.", "success": true });
    } else {
      res.json({ "message": "Error.", "success": false });
    }
  } else {
    res.json({ "message": "Required fields missing", "success": false });
  }
})

app.get('/prisma/lalasa/wallet', async (req, res) => {
  await executeLatinFunction()
  var sbId = req.query.sbId
  const result = await prisma.lalasa_wallet.findMany({
    where: sbId ? { sbId: sbId + "" } : {},
    orderBy: { id: "desc" }
  })
  if (result) {
    const resultupdate = await prisma.lalasa_serviceboy.findFirst({
      where: { id: Number(sbId) },
      orderBy: { id: "desc" }
    })
    res.json({ "data": result, "totalAmount": resultupdate.wallet, "message": "wallet successfully fetched", "success": true });
  } else {
    res.json({ "message": "No wallet found.", "success": false });
  }
})

app.delete('/prisma/lalasa/wallet', async (req, res) => {
  await executeLatinFunction()
  var id = req.query.id
  if (id) {
    const result = await prisma.lalasa_wallet.delete({
      where: { id: Number(id) }
    });
    if (result) {
      res.json({ "message": "Wallet successfully deleted.", "success": true });
    } else {
      res.json({ "message": "No wallet found.", "success": false });
    }
  } else {
    res.json({ "message": "Required fields missing", "success": false });
  }
})

app.post('/prisma/lalasa/notify', async (req, res) => {
  await executeLatinFunction()
  var title = req.body.title
  var subTitle = req.body.subTitle
  var isRead = req.body.isRead
  if (title && subTitle && isRead) {
    const result = await prisma.lalasa_notify.create({
      data: { title: title, subTitle: subTitle, isRead: isRead }
    });
    if (result) {
      res.json({ "data": result, "message": "Notify successfully created.", "success": true })
    } else {
      res.json({ "message": "Oops! An error occurred.", "success": false })
    }
  } else {
    res.json({ "message": "Required fields missing", "success": false });
  }
})

app.put('/prisma/lalasa/notify', async (req, res) => {
  await executeLatinFunction()
  var id = req.body.id
  var title = req.body.title
  var subTitle = req.body.subTitle
  var isRead = req.body.isRead
  if (id && title && subTitle && isRead) {
    const result = await prisma.lalasa_notify.updateMany({
      where: { id: Number(id) },
      data: { title: title, subTitle: subTitle, isRead: isRead }
    });
    if (result) {
      res.json({ "message": "Notify successfully updated.", "success": true });
    } else {
      res.json({ "message": "Error.", "success": false });
    }
  } else {
    res.json({ "message": "Required fields missing", "success": false });
  }
})

app.get('/prisma/lalasa/notify', async (req, res) => {
  await executeLatinFunction()
  var id = req.query.id
  const result = await prisma.lalasa_notify.findMany({
    where: id ? { id: Number(id) } : {},
    orderBy: { id: "desc" }
  })
  if (result) {
    res.json({ "data": result, "message": "notify successfully fetched", "success": true });
  } else {
    res.json({ "message": "No notify found.", "success": false });
  }
})

app.delete('/prisma/lalasa/notify', async (req, res) => {
  await executeLatinFunction()
  var id = req.query.id
  if (id) {
    const result = await prisma.lalasa_notify.delete({
      where: { id: Number(id) }
    });
    if (result) {
      res.json({ "message": "Notify successfully deleted.", "success": true });
    } else {
      res.json({ "message": "No Notify found.", "success": false });
    }
  } else {
    res.json({ "message": "Required fields missing", "success": false });
  }
})

async function sendmail(mailOptions) {
  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log('Email sent: ' + info.response);
    }
  });
}

async function pushNotification(title, message, key, topic) {
  const data = JSON.stringify({
    "to": topic,
    "priority": "high",
    "data": { "title": title, "message": message }
  })
  const options = {
    hostname: 'fcm.googleapis.com',
    path: '/fcm/send',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length,
      'Authorization': key
    },
    timeout: 11000,
  }
  const req = https.request(options, (res) => {
    let data = '';
    console.log('Status Code:', res.statusCode);
    res.on('data', (chunk) => {
      data += chunk;
    });
    res.on('end', () => {
      console.log(data)
    });

  }).on("error", (err) => {
  });
  req.write(data);
  req.end();
}

app.post('/prisma/lalasa/fileUpload', async (req, res) => {
  await executeLatinFunction()
  upload(req, res, (err) => {
    if (err) {
      res.json({ "error": true, "message": err.message });
    } else {
      res.json({ "error": false, "message": "Image uploaded successfully" });
    }
  });
})

app.post('/prisma/lalasa/excelUpload/:type', async (req, res) => {
  await executeLatinFunction()
  var type = req.params.type
  var result
  uploadFile(req, res, async (err) => {
    if (err) {
      res.json({ "error": true, "message": err.message });
    } else {
      let path =
        "./exceluploads/" + req.file.filename;
      readXlsxFile(path).then(async (rows) => {
        rows.shift();
        let tutorials = [];
        await Promise.all(rows.map(async (row) => {
          var offer = type == 'Pet' ? row[11] : type == 'Accessories' ? row[9] : row[8]
          var price = type == 'Pet' ? row[12] : type == 'Accessories' ? row[10] : row[9]
          var strikePrice = parseInt(((offer * price) / 100).toFixed(2)) + parseInt(price)
          let tutorial = type == 'Pet' ? {
            name: row[0],
            shopType: row[1],
            type: row[2],
            image: row[3],
            breed: row[4],
            weight: JSON.stringify(row[5]),
            gender: row[6],
            dob: row[7],
            description: row[8],
            freedelivery: JSON.stringify(row[9]),
            rating: JSON.stringify(row[10]),
            offer: JSON.stringify(row[11]),
            price: JSON.stringify(row[12]),
            age: JSON.stringify(row[13]),
            bestSelling: JSON.stringify(row[14]),
            shopId: JSON.stringify(row[15]),
            pincode: JSON.stringify(row[16]),
            userId: "Not Specified",
            category: "Not Specified",
            strikePrice: JSON.stringify(strikePrice),
            petSize: row[17],
            petAgressive: row[18],
            priceRange: "[]",
            discount: "Not Specified"
          } : type == 'Accessories' ? {
            name: row[0],
            shopType: row[1],
            category: row[2],
            type: row[3],
            image: row[4],
            breed: row[5],
            description: row[6],
            freedelivery: JSON.stringify(row[7]),
            rating: JSON.stringify(row[8]),
            offer: JSON.stringify(row[9]),
            price: JSON.stringify(row[10]),
            bestSelling: JSON.stringify(row[11]),
            shopId: JSON.stringify(row[12]),
            pincode: JSON.stringify(row[13]),
            weight: "Not Specified",
            gender: "Not Specified",
            dob: "Not Specified",
            userId: "Not Specified",
            age: "Not Specified",
            strikePrice: JSON.stringify(strikePrice),
            petSize: "Not Specified",
            petAgressive: "Not Specified",
            priceRange: "[]",
            discount: "Not Specified"

          } :
            type == 'Restaurant' ? {
              name: row[0],
              shopType: row[1],
              category: row[2],
              type: row[3],
              image: row[4],
              breed: row[5],
              description: row[6],
              freedelivery: JSON.stringify(row[7]),
              rating: JSON.stringify(row[8]),
              offer: '0',
              price: JSON.stringify(row[9]),
              bestSelling: '0',
              shopId: JSON.stringify(row[10]),
              pincode: JSON.stringify(row[11]),
              weight: "Not Specified",
              gender: "Not Specified",
              dob: "Not Specified",
              userId: "Not Specified",
              age: "Not Specified",
              strikePrice: JSON.stringify(row[9]),
              petSize: "Not Specified",
              petAgressive: "Not Specified",
              priceRange: row[12],
              discount: row[13]

            }
              : {
                name: row[0],
                shopType: row[1],
                type: row[2],
                image: row[3],
                breed: row[4],
                description: row[5],
                freedelivery: JSON.stringify(row[6]),
                rating: JSON.stringify(row[7]),
                offer: JSON.stringify(row[8]),
                price: JSON.stringify(row[9]),
                bestSelling: JSON.stringify(row[10]),
                shopId: JSON.stringify(row[11]),
                pincode: JSON.stringify(row[12]),
                isAdopt: JSON.stringify(row[13]),
                weight: JSON.stringify(row[14]),
                gender: row[15],
                dob: row[16],
                age: JSON.stringify(row[17]),
                userId: "Not Specified",
                category: "Not Specified",
                strikePrice: JSON.stringify(strikePrice),
                petSize: row[18],
                petAgressive: row[19],
                priceRange: "[]",
                discount: "Not Specified"

              };
          tutorials.push(tutorial)
        }));

        result = await prisma.lalasa_pets.createMany({
          data: tutorials
        });
        fs.unlink('./exceluploads/' + req.file.filename, (err) => {
        });
        res.json({ "message": result.count + " " + "records upload successfully.", "success": true });
      });
    }
  });
})

app.post('/prisma/lalasa/fileFeed', async (req, res) => {
  await executeLatinFunction()
  uploadFeed(req, res, (err) => {
    if (err) {
      res.json({ "error": true, "message": err.message });
    } else {
      res.json({ "error": false, "message": "Image uploaded successfully" });
    }
  });
})

app.post('/prisma/lalasa/video', async (req, res) => {
  await executeLatinFunction()
  uploadVideo(req, res, (err) => {
    if (err) {
      res.json({ "error": true, "message": err.message });
    } else {
      res.json({ "error": false, "message": "Video uploaded successfully" });
    }
  });
})

app.get('/prisma/lalasa/video', async (req, res) => {
  await executeLatinFunction()
  fs.readdir("./video", function (err, files) {
    if (err) {
      res.json();
    }
    let filesv = "";
    files.forEach(function (file) {
      filesv = filesv + file + ",";
    });
    res.json({ "files": filesv });
  });
})

app.delete('/prisma/lalasa/video', async (req, res) => {
  await executeLatinFunction()
  var name = req.query.name
  if (name) {
    fs.unlink('./video/' + name, (err) => {
      if (err) {
        res.json({ "message": "Error in delete", "success": 0 });
      }
      res.json({ "message": "video deleted", "success": 1 });
    });
  } else {
    res.json({ "message": "Required fields missing", "success": 0 });
  }
})

app.get('/prisma/lalasa/get_all_feed', async (req, res) => {
  await executeLatinFunction()
  fs.readdir("./feed", function (err, files) {
    if (err) {
      res.json();
    }
    let filesv = "";
    files.forEach(function (file) {
      filesv = filesv + file + ",";
    });
    res.json({ "files": filesv });
  });
})

app.get('/prisma/lalasa/template/:type', async (req, res) => {
  await executeLatinFunction()
  // let tutorials = [];
  var type = req.params.type
  let workbook = new excel.Workbook();
  let worksheet = workbook.addWorksheet("Tutorials");

  worksheet.columns = type == 'Pet' ? [
    { header: "Name", key: "name", width: 15 },
    { header: "ShopType", key: "shopType", width: 15 },
    { header: "Type", key: "type", width: 25 },
    { header: "Image", key: "image", width: 25 },
    { header: "Breed", key: "breed", width: 10 },
    { header: "Weight", key: "weight", width: 10 },
    { header: "Gender", key: "gender", width: 10 },
    { header: "Dob", key: "dob", width: 10 },
    { header: "Description", key: "description", width: 25 },
    { header: "Freedelivery", key: "freedelivery", width: 10 },
    { header: "Rating", key: "rating", width: 10 },
    { header: "Offer", key: "offer", width: 10 },
    { header: "Price", key: "price", width: 10 },
    { header: "Age", key: "age", width: 10 },
    { header: "BestSelling", key: "bestSelling", width: 10 },
    { header: "ShopId", key: "shopId", width: 10 },
    { header: "Pincode", key: "pincode", width: 10 },
    { header: "petSize", key: "petSize", width: 10 },
    { header: "petAgressive", key: "petAgressive", width: 10 },

    // { header: "isAdopt", key: "isAdopt", width: 10 },
    // { header: "Category", key: "category", width: 10 },

  ] : type == 'Accessories' ? [
    { header: "Name", key: "name", width: 15 },
    { header: "ShopType", key: "shopType", width: 15 },
    { header: "Category", key: "category", width: 10 },
    { header: "Type", key: "type", width: 25 },
    { header: "Image", key: "image", width: 25 },
    { header: "Breed", key: "breed", width: 10 },
    { header: "Description", key: "description", width: 25 },
    { header: "Freedelivery", key: "freedelivery", width: 10 },
    { header: "Rating", key: "rating", width: 10 },
    { header: "Offer", key: "offer", width: 10 },
    { header: "Price", key: "price", width: 10 },
    { header: "BestSelling", key: "bestSelling", width: 10 },
    { header: "ShopId", key: "shopId", width: 10 },
    { header: "Pincode", key: "pincode", width: 10 },

  ] : type == 'Restaurant' ? [
    { header: "Name", key: "name", width: 15 },
    { header: "ShopType", key: "shopType", width: 15 },
    { header: "Category", key: "category", width: 10 },
    { header: "Type", key: "type", width: 25 },
    { header: "Image", key: "image", width: 25 },
    { header: "Breed", key: "breed", width: 10 },
    { header: "Description", key: "description", width: 25 },
    { header: "Freedelivery", key: "freedelivery", width: 10 },
    { header: "Rating", key: "rating", width: 10 },
    { header: "Price", key: "price", width: 10 },
    { header: "ShopId", key: "shopId", width: 10 },
    { header: "Pincode", key: "pincode", width: 10 },
    { header: "Quantity Price", key: "Quantity Price", width: 25 },
    { header: "Discount", key: "discount", width: 25 }

  ] : [
    { header: "Name", key: "name", width: 15 },
    { header: "ShopType", key: "shopType", width: 15 },
    { header: "Type", key: "type", width: 25 },
    { header: "Image", key: "image", width: 25 },
    { header: "Breed", key: "breed", width: 10 },
    { header: "Description", key: "description", width: 25 },
    { header: "Freedelivery", key: "freedelivery", width: 10 },
    { header: "Rating", key: "rating", width: 10 },
    { header: "Offer", key: "offer", width: 10 },
    { header: "Price", key: "price", width: 10 },
    { header: "BestSelling", key: "bestSelling", width: 10 },
    { header: "ShopId", key: "shopId", width: 10 },
    { header: "Pincode", key: "pincode", width: 10 },
    { header: "isAdopt", key: "isAdopt", width: 10 },
    { header: "Weight", key: "weight", width: 10 },
    { header: "Gender", key: "gender", width: 10 },
    { header: "Dob", key: "dob", width: 10 },
    { header: "Age", key: "age", width: 10 },
    { header: "petSize", key: "petSize", width: 10 },
    { header: "petAgressive", key: "petAgressive", width: 10 }
  ];

  // Add Array Rows
  // worksheet.addRows(tutorials);

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader(
    "Content-Disposition",
    "attachment; filename=" + type == 'Pet' ? "pet.xlsx" : type == 'Accessories' ? "Accessories.xlsx" : "Adoption.xlsx"
  );

  return workbook.xlsx.write(res).then(function () {
    res.status(200).end();
  });
})

app.delete('/prisma/lalasa/fileDelete', async (req, res) => {
  await executeLatinFunction()
  var name = req.query.name
  if (name) {
    fs.unlink('./feed/' + name, (err) => {
      if (err) {
        res.json({ "message": "Error in delete", "success": 0 });
      }
      res.json({ "message": "File deleted", "success": 1 });
    });
  } else {
    res.json({ "message": "Required fields missing", "success": 0 });
  }
})


const upload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "./images");
    },
    filename: function (req, file, cb) {
      cb(null, file.originalname);
    }
  }),
  fileFilter: function (req, file, callback) {
    var ext = path.extname(file.originalname);
    if (ext !== '.png' && ext !== '.jpg' && ext !== '.gif' && ext !== '.jpeg' && ext !== '.pdf') {
      return callback(new Error('Only images are allowed'))
    }
    callback(null, true)
  },
  limits: {
    fileSize: 1024 * 1024 * 1024
  }
}).single("image");

const uploadFeed = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "./feed");
    },
    filename: function (req, file, cb) {
      cb(null, file.originalname);
    }
  }),
  fileFilter: function (req, file, callback) {
    var ext = path.extname(file.originalname);
    if (ext !== '.png' && ext !== '.jpg' && ext !== '.gif' && ext !== '.jpeg') {
      return callback(new Error('Only images are allowed'))
    }
    callback(null, true)
  },
  limits: {
    fileSize: 1024 * 1024 * 1024
  }
}).single("image");



const uploadVideo = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "./video");
    },
    filename: function (req, file, cb) {
      cb(null, file.originalname);
    }
  }),
  fileFilter: function (req, file, callback) {
    var ext = path.extname(file.originalname);
    if (ext !== '.mp4') {
      return callback(new Error('Only videos are allowed'))
    }
    callback(null, true)
  },
  limits: {
    fileSize: 1024 * 1024 * 1024
  }
}).single("video");

const excelFilter = (req, file, cb) => {
  console.log('enter')
  if (
    file.mimetype.includes("excel") ||
    file.mimetype.includes("spreadsheetml")
  ) {
    cb(null, true);
  } else {
    cb("Please upload only excel file.", false);
  }
};

var storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './exceluploads');
  },
  filename: (req, file, cb) => {
    console.log(file.originalname);
    cb(null, `${Date.now()}-bezkoder-${file.originalname}`);
  },
});

// var uploadFile = multer({ storage: storage, fileFilter: excelFilter }).single("exceluploads");
// module.exports = uploadFile;


const uploadFile = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "./exceluploads");
    },
    filename: function (req, file, cb) {
      console.log(file)
      cb(null, file.originalname);
    }
  }),
  fileFilter: function (req, file, callback) {
    var ext = path.extname(file.originalname);
    if (ext !== '.xlsx' && ext !== '.xlsm') {
      return callback(new Error('Only Excel are allowed'))
    }
    callback(null, true)
  },
  limits: {
    fileSize: 1024 * 1024 * 1024
  }
}).single("file");

app.use(express.static(__dirname + '/prisma/lalasa/exceluploads'));

app.use(express.static(__dirname + '/prisma/lalasa/images'));
app.use(express.static(__dirname + '/prisma/lalasa/feed'));
app.use(express.static(__dirname + '/prisma/lalasa/video'));


app.get('/prisma/lalasa/images/*', async (req, res) => {
  res.sendFile('C:/Users/Admin/Desktop/Network_api/serviceboy/' + req.path.replace("small/", "").replace("prisma/", ""))
  // res.sendFile('/home/arthy' + req.path.replace("small/", ""))
})

app.get('/prisma/lalasa/feed/*', async (req, res) => {
  res.sendFile('C:/Users/Admin/Desktop/Network_api/' + req.path.replace("small/", "").replace("prisma/", ""))
  // res.sendFile('/home/arthy' + req.path)
})

app.get('/prisma/lalasa/video/*', async (req, res) => {
  res.sendFile('C:/Users/Admin/Desktop/Network_api/' + req.path.replace("small/", "").replace("prisma/", ""))
  // res.sendFile('/home/arthy' + req.path)
})

app.use((req, res) => {
  return res.status(404).json({
    status: false,
    message: `${req.method} at ${req.path} not found`,
  });
});

app.listen(8133, () => console.log(`Server ready at: http://localhost:8133`)).on("error", err => {
  console.log(err)
})

async function executeLatinFunction() {
  await prisma.$executeRaw('SET NAMES latin1')
  await prisma.$executeRaw("SET CHARACTER SET latin1")
  await prisma.$executeRaw("SET character_set_connection=latin1")
}
