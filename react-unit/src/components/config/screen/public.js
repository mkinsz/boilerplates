
export const limitInput = (str,reg,size)=>
{
    let _str = str
    _str = _str.replace(reg,'')
    
    let _size = 0,_n=0
    let _reg = /[\u4e00-\u9fa5]/
    for(let char of _str){
        _size+= _reg.test(char)?3:1
        _n++
        console.log('_reg',_size,char)
        if(_size>size)
        {
            _str=_str.substring(0,_n-1)
            break
        }
    }
    return _str
}

 