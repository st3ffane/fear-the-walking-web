//--require property_binding

/*
  ----------------------------------------------------------------------------
  "THE BEER-WARE LICENSE" (Revision 42):
  <steph.ponteins@gmail.com> wrote this file. As long as you retain this notice you
  can do whatever you want with this stuff. If we meet some day, and you think
  this stuff is worth it, you can buy me a beer in return.
  ----------------------------------------------------------------------------


  Fear the walking web - Flesh & Bones - 0.3 - rewrite!

  
  textcontent_binding.js:

*/
      
/* un binding sur une zone de texte (en general, entre 2 balises)*/
function __textContent_binding(infos){    
    
    __prop_binding.call(this, infos);
    this._index = infos._index;		//index dans la chaine argument ou se trouve le binding
    this._length = infos._length;	//taille de la donn�e du binding (en char)


    
}

__textContent_binding.prototype = new __prop_binding( );
__textContent_binding.prototype.populate = function(value, context, extra){


        if(value == null) value = this.fallback;
	value =""+ this.convert_value (value, context);//force string



        //probleme, si binding interieur, il y a du texte...
        var dt = this._element.textContent;


        //remplace dans la string html, garde ce qu'il y a avant et apres
        var start = this._index == 0 ? "" : dt.substring(0, this._index);
        var end = dt.substring(this._index + this._length);
        //la taille de la datas (pour pouvoir modifier apres)

        this._length = value.length;
        this._element.textContent = start + value + end ;
        this._key_uuid_ = context.__uuid__+":"+this.from;
    }