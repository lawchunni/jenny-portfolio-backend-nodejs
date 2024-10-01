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
    .catch(() => {
      res.status(500).json({error: 'Could not fetch the document'});
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
    slug
  }

  newData.highlight = highlight === 'true';
  newData.deleted = deleted === 'true';

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
    res.status(500).json({ error: 'Failed to update record'})
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
    slug
  }

  newData.highlight = highlight === 'true';
  newData.deleted = deleted === 'true';

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
      res.status(404).json({ message: 'No change made.'});
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to update record'})
  }
}

module.exports = { 
  getPortfolioList, 
  getPortfolioSingle,
  createPortfolioSingle,
  updatePortfolioSingle
};
