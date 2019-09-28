 class APIFeatures {

  constructor(query, queryString){
    this.query = query;
    this.queryString = queryString;
  }

  filter(){
     //1A)build query 
    const queryObj = {...this.queryString};
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach(field => delete queryObj[field]);

    //1B)Advanced filtering
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);
    this.query = this.query.find(JSON.parse(queryStr));
    return this;
  }

  sort(){

      //2) Sorting 
    if(this.queryString.sort){
      //Multiple query strings are seperated by comma, hence we remove and add with space.
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);//Pass field name to be sorted by 
    }
    // }else {
    //   //Default sorting if nothing is selected
    //   //query = query.sort()
    // }
    return this;
  }

  fields(){
    //3)Select certain fields
    if(this.queryString.fields){
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields)
    }else {
      this.query = this.query.select('-__v');
    }
    return this;
  }

  pagination(){
    //4) Pagination
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 100;
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);
    return this;
  }
}

module.exports = APIFeatures;