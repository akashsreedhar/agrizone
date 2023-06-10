var express = require('express');
var router = express.Router();
var productHelpers=require('../helpers/product-helpers');
const userHelpers = require('../helpers/user-helpers');


/* GET users listing. */

router.get('/',async function(req, res, next) {
  

 
  users=await userHelpers.getallusers()
  productHelpers.getallproducts().then((products)=>{
    res.render('admin/view-products',{admin:true,products});
  })

});
router.get('/add-products',function(req,res,next){
  
  res.render('admin/add-products',{admin:true});
});
router.post('/add-products',(req,res,next)=>{
  console.log(req.body);
  console.log(req.files.image);
  
  productHelpers.addproducts(req.body,(id)=>{
    let image=req.files.image
    image.mv('./public/product-images/'+id+'.jpg',(err,done)=>{
      if(!err){
        res.render("admin/add-products",{admin:true});

      }
    })
    
})
});





router.get('/delete-product/:id',(req,res)=>{
let proId=req.params.id
console.log(proId);
productHelpers.deleteProduct(proId).then((response)=>{
  res.redirect('/admin/')
})
})
router.get('/edit-product/:id',async (req,res)=>{
 
  let product=await productHelpers.getProductDetalis(req.params.id)
  console.log(product);
  res.render('admin/edit-product',{admin:true,product})
})
router.post('/edit-product/:id',(req,res)=>{
  console.log(req.params.id);
  let id=req.params.id
  productHelpers.updateProduct(req.params.id,req.body).then(()=>{
    res.redirect('/admin')
    if(req.files.image){
      let Image=req.files.image
      Image.mv('./public/product-images/'+id+'.jpg')

    }
  })
})
router.get('/all-orders',async (req,res)=>{
  console.log('call vann all orders')
  let products=await userHelpers.getAllOrder()
  console.log('products')
  res.render('admin/all-orders',{products,admin:true})
})
router.get('/showcase',(req,res)=>{
  
  productHelpers.getallproducts().then((products)=>{
    res.render('admin/showcase',{products,admin:true,users});
  })
})
router.get('/Alluser',(req,res)=>{
  userHelpers.getallusers().then((users)=>{

    res.render('admin/Alluser',{users,admin:true});

  })
})
router.get('/change-user-status',(req,res)=>{
  console.log(req.query.id)
  console.log(req.query.status);
  if(req.query.status==='active'){
    userHelpers.blockUser(req.query.id).then(()=>{
      console.log('Blocked')
      res.redirect('/admin/Alluser')
    })
  }
  else{
    userHelpers.unblockUser(req.query.id).then(()=>{
      console.log('unBlocked')
      res.redirect('/admin/Alluser')
    })
  }
})
module.exports = router;
