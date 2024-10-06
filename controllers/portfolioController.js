const { ObjectId } = require('mongodb');

// get portfolio list
const getPortfolioList = async (req, res, db) => {
  let records = [];

  db.collection('portfolio')
    .find() // return cursor
    .sort({ _id: -1 })
    .forEach(record => records.push(record))
    .then(() => {
      res.status(200).json(records)
    })
    .catch((err) => {
      res.status(500).json({error: `Could not fetch the document: ${err}`});
    })
}

// get single portfolio item
const getPortfolioSingle = async (req, res, db) => {
  
  db.collection('portfolio')
    .findOne({_id: new ObjectId(req.params.id)})
    .then(doc => {
      res.status(200).json(doc)
    }) 
    .catch(err => {
      res.status(500).json({error: 'Could not fetch the document'})
    })
}

// create a new portfolio item into database 
const createPortfolioSingle = async (req, res, db) => {
  const {
    title,
    desc_short,
    desc_long,
    tags,
    slug,
    highlight,
    deleted
  } = req.body;

  let newData = {
    title,
    desc_short,
    desc_long,
    tags,
    slug,
    highlight: highlight === 'true',
    deleted: deleted === 'true',
    create_date: new Date(),
    update_date: new Date(),
  }

  try {

    if (req.files.thumbnail) {
      newData.thumbnail = `/uploads/${req.files.thumbnail[0].filename}`;
    }
    
    if (req.files.images) {
      // combind existing images with new added images 
      newData.images = req.files.images.map(file => `/uploads/${file.filename}`);
    }

    const result = await db.collection('portfolio').insertOne(newData);
    res.status(201).json({ message: 'Portfolio item created successfully', itemId: result.insertedId});

  } catch (err) {
    res.status(500).json({ error: `Failed to update record: ${err}`})
  }
}

// update single portfolio item 
const updatePortfolioSingle = async (req, res, db) => {
   const {
    title,
    desc_short,
    desc_long,
    tags,
    slug,
    highlight,
    deleted
  } = req.body;

  let newData = {
    title,
    desc_short,
    desc_long,
    tags,
    slug,
    highlight: highlight === 'true',
    deleted: deleted === 'true',
    update_date: new Date(),
  }

  try {

    const existingItem = await db.collection('portfolio').findOne({ _id: new ObjectId(req.params.id)});


    if (!existingItem) {
      return res.status(404).json({ error: 'Portfolio item not found.'});
    }

    if (req.files.thumbnail) {
      newData.thumbnail = `/uploads/${req.files.thumbnail[0].filename}`;
    }
    
    if (req.files.images) {
      // combind existing images with new added images 
      const newImageUrls = req.files.images.map(file => `/uploads/${file.filename}`);
      newData.images = [...existingItem.images, ...newImageUrls];
    }

    const result = await db.collection('portfolio').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: newData}
    );

    if(result.modifiedCount > 0) {
      res.status(200).json({ message: 'Portfolio item updated successfully. '});
    } else {
      res.status(404).json({ message: 'Can not find the portfolio item'});
    }
  } catch (err) {
    res.status(500).json({ error: `Failed to update record: ${err}`})
  }
}

module.exports = { 
  getPortfolioList, 
  getPortfolioSingle,
  createPortfolioSingle,
  updatePortfolioSingle
};
