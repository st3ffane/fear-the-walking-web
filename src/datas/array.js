/*
  ----------------------------------------------------------------------------
  "THE BEER-WARE LICENSE" (Revision 42):
  <steph.ponteins@gmail.com> wrote this file. As long as you retain this notice you
  can do whatever you want with this stuff. If we meet some day, and you think
  this stuff is worth it, you can buy me a beer in return.
  ----------------------------------------------------------------------------


  Fear the walking web - Flesh & Bones - 0.3 - rewrite!

  array.js: l'objet de base pour les tableaux "bindés" par le framework
  Permet d'etre prevenu lors d'une modification du tableau
  

*/

//surcharge qqs methodes de array pour etr prevenu des push, slice...
var DBArray = Object.create(Array);

//DBArray.__proto__ = new Array();
DBArray.push = function(){

    //ajoute a l'array
    Array.prototype.push.apply(this,arguments);
    if(this.__owners__){
        //previens les owners
        var extra = {action:'PUSH', value: arguments.length};//le nombre de datas ajoutés: voir plus tard...
        
        for (owi=0;owi<this.__owners__.length; owi++){
            ow = this.__owners__[owi];
            if(ow[0].notifyDatasetChanged){
                //DOIT INFORMER DE CE QU'IL DOIT FAIRE: ie AJOUT A LA FIN
                ow[0].notifyDatasetChanged(ow[1],extra);
            }
        }
    }

};
DBArray.splice = function(){
    //ajoute ET supprime
    
    Array.prototype.splice.apply(this,arguments);
    extra = {action:"SPLICE",index:arguments[0], howmany:arguments[1], count:arguments.length - 2}//
    if(this.__owners__){

        for (owi=0;owi<this.__owners__.length; owi++){
            ow = this.__owners__[owi];
            if(ow[0].notifyDatasetChanged) ow[0].notifyDatasetChanged(ow[1],extra);
        }
    }
};
DBArray.pop = function(){
    //supprime le dernier element de la liste
    var p = Array.prototype.pop(this,arguments);
    
    if(this.__owners__){
        var extra = {action:'POP'};
        for (owi=0;owi<this.__owners__.length; owi++){
            ow = this.__owners__[owi];
            if(ow[0].notifyDatasetChanged) ow[0].notifyDatasetChanged(ow[1], extra);
        }
    }
    return p;
};
DBArray.shift = function(){
    //retire le premier elemnt du tableau
    p = Array.prototype.shift.apply(this,arguments);
    extra = {action:'SHIFT'}
    if(this.__owners__){

        for (owi=0;owi<this.__owners__.length; owi++){
            ow = this.__owners__[owi];
            if(ow[0].notifyDatasetChanged) ow[0].notifyDatasetChanged(ow[1],extra);
        }
    }
    return p;
};
DBArray.unshift = function(){
    //ajoute un ou plusieurs element au tableau en debut
    p = Array.prototype.unshift.apply(this,arguments);
    extra = {action:'UNSHIFT', value: arguments.length};//le nombre de datas ajoutés: voir plus tard...

    if(this.__owners__){

        for (owi=0;owi<this.__owners__.length; owi++){
            ow = this.__owners__[owi];
            if(ow[0].notifyDatasetChanged) ow[0].notifyDatasetChanged(ow[1], extra);
        }
    }
    return p;//la nouvelle longueur du tableau
};
//overribe bracket setter? voir avec les proxies
DBArray.set = function (obj, index){
    //modifie l'item a l'index
    //NOTE: on pourrait (!!) creer des property pour chaque element de l'array
    //mais si il y en a beaucoup????
    old = this[index].__uuid__;

    this[index] = obj;
    extra = {action:'SET', index: index};//uuid de l'objet a supprimer...

    if(this.__owners__){

        for (owi=0;owi<this.__owners__.length; owi++){
            ow = this.__owners__[owi];
            if(ow[0].notifyDatasetChanged) ow[0].notifyDatasetChanged(ow[1], extra);
        }
    }
}

