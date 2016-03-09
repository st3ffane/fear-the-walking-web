//--require property_binding

/*
  ----------------------------------------------------------------------------
  "THE BEER-WARE LICENSE" (Revision 42):
  <steph.ponteins@gmail.com> wrote this file. As long as you retain this notice you
  can do whatever you want with this stuff. If we meet some day, and you think
  this stuff is worth it, you can buy me a beer in return.
  ----------------------------------------------------------------------------


  Fear the walking web - Flesh & Bones - 0.3 - rewrite!

  
  attribute_binding.js:

*/

/*binding d'un attribute HTML (ex: class)*/
function __attr_binding(infos){

    __prop_binding.call(this, infos);


    this._index = infos._index;		//index dans la chaine argument ou se trouve le binding
    this._length = infos._length;	//taille de la donn�e du binding (en char)
    
}
__attr_binding.prototype = new __prop_binding(  );
__attr_binding.prototype.populate = function(value, context, extra){

        //pas une property de l'element (ex: class), modifie le html
        if(value == null) value = this.fallback;
		value =""+ this.convert_value (value, context);//force string

        var dt = this._element.getAttribute("data-binded-"+this.to);
        if(dt == null){
            //ancienne facon?
            dt = this._element.getAttribute(this.to);
        }
        //remplace dans la string html, garde ce qu'il y a avant et apres
        var start = this._index == 0 ? "" : dt.substring(0, this._index);
        var end = dt.substring(this._index + this._length);
        
        var finale_value = start + value + end;
        _dom_batch_.dom_batch_set_attribute(this._element, this.to, finale_value);
        //this._element.setAttribute(this.to,start + value + end );
        this._key_uuid_ = context.__uuid__+":"+this.from;
    }

    
    