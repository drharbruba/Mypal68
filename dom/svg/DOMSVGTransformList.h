/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

#ifndef MOZILLA_DOMSVGTRANSFORMLIST_H__
#define MOZILLA_DOMSVGTRANSFORMLIST_H__

#include "DOMSVGAnimatedTransformList.h"
#include "nsCycleCollectionParticipant.h"
#include "nsDebug.h"
#include "SVGTransformList.h"
#include "nsTArray.h"
#include "mozilla/Attributes.h"
#include "mozilla/ErrorResult.h"

namespace mozilla {

namespace dom {
struct DOMMatrix2DInit;
class DOMSVGTransform;
class SVGElement;
class SVGMatrix;

/**
 * Class DOMSVGTransformList
 *
 * This class is used to create the DOM tearoff objects that wrap internal
 * SVGTransformList objects.
 *
 * See the architecture comment in DOMSVGAnimatedTransformList.h.
 */
class DOMSVGTransformList final : public nsISupports, public nsWrapperCache {
  friend class AutoChangeTransformListNotifier;
  friend class dom::DOMSVGTransform;

  ~DOMSVGTransformList() {
    // Our mAList's weak ref to us must be nulled out when we die. If GC has
    // unlinked us using the cycle collector code, then that has already
    // happened, and mAList is null.
    if (mAList) {
      (IsAnimValList() ? mAList->mAnimVal : mAList->mBaseVal) = nullptr;
    }
  }

 public:
  NS_DECL_CYCLE_COLLECTING_ISUPPORTS
  NS_DECL_CYCLE_COLLECTION_SCRIPT_HOLDER_CLASS(DOMSVGTransformList)

  DOMSVGTransformList(dom::DOMSVGAnimatedTransformList* aAList,
                      const SVGTransformList& aInternalList)
      : mAList(aAList) {
    // aInternalList must be passed in explicitly because we can't use
    // InternalList() here. (Because it depends on IsAnimValList, which depends
    // on this object having been assigned to aAList's mBaseVal or mAnimVal,
    // which hasn't happened yet.)

    InternalListLengthWillChange(aInternalList.Length());  // Sync mItems
  }

  virtual JSObject* WrapObject(JSContext* cx,
                               JS::Handle<JSObject*> aGivenProto) override;

  nsISupports* GetParentObject() { return static_cast<nsIContent*>(Element()); }

  /**
   * This will normally be the same as InternalList().Length(), except if we've
   * hit OOM in which case our length will be zero.
   */
  uint32_t LengthNoFlush() const {
    MOZ_ASSERT(mItems.IsEmpty() || mItems.Length() == InternalList().Length(),
               "DOM wrapper's list length is out of sync");
    return mItems.Length();
  }

  /// Called to notify us to synchronize our length and detach excess items.
  void InternalListLengthWillChange(uint32_t aNewLength);

  /**
   * Returns true if our attribute is animating (in which case our animVal is
   * not simply a mirror of our baseVal).
   */
  bool IsAnimating() const { return mAList->IsAnimating(); }
  /**
   * Returns true if there is an animated list mirroring the base list.
   */
  bool AnimListMirrorsBaseList() const {
    return mAList->mAnimVal && !mAList->IsAnimating();
  }

  uint32_t NumberOfItems() const {
    if (IsAnimValList()) {
      Element()->FlushAnimations();
    }
    return LengthNoFlush();
  }
  void Clear(ErrorResult& error);
  already_AddRefed<dom::DOMSVGTransform> Initialize(
      dom::DOMSVGTransform& newItem, ErrorResult& error);
  already_AddRefed<dom::DOMSVGTransform> GetItem(uint32_t index,
                                                 ErrorResult& error);
  already_AddRefed<dom::DOMSVGTransform> IndexedGetter(uint32_t index,
                                                       bool& found,
                                                       ErrorResult& error);
  already_AddRefed<dom::DOMSVGTransform> InsertItemBefore(
      dom::DOMSVGTransform& newItem, uint32_t index, ErrorResult& error);
  already_AddRefed<dom::DOMSVGTransform> ReplaceItem(
      dom::DOMSVGTransform& newItem, uint32_t index, ErrorResult& error);
  already_AddRefed<dom::DOMSVGTransform> RemoveItem(uint32_t index,
                                                    ErrorResult& error);
  already_AddRefed<dom::DOMSVGTransform> AppendItem(
      dom::DOMSVGTransform& newItem, ErrorResult& error) {
    return InsertItemBefore(newItem, LengthNoFlush(), error);
  }
  already_AddRefed<dom::DOMSVGTransform> CreateSVGTransformFromMatrix(
      const DOMMatrix2DInit& aMatrix, ErrorResult& aRv);
  already_AddRefed<dom::DOMSVGTransform> Consolidate(ErrorResult& error);
  uint32_t Length() const { return NumberOfItems(); }

 private:
  dom::SVGElement* Element() const { return mAList->mElement; }

  /// Used to determine if this list is the baseVal or animVal list.
  bool IsAnimValList() const {
    MOZ_ASSERT(this == mAList->mBaseVal || this == mAList->mAnimVal,
               "Calling IsAnimValList() too early?!");
    return this == mAList->mAnimVal;
  }

  /**
   * Get a reference to this object's corresponding internal SVGTransformList.
   *
   * To simplify the code we just have this one method for obtaining both
   * baseVal and animVal internal lists. This means that animVal lists don't
   * get const protection, but our setter methods guard against changing
   * animVal lists.
   */
  SVGTransformList& InternalList() const;

  /// Returns the DOMSVGTransform at aIndex, creating it if necessary.
  already_AddRefed<dom::DOMSVGTransform> GetItemAt(uint32_t aIndex);

  void MaybeInsertNullInAnimValListAt(uint32_t aIndex);
  void MaybeRemoveItemFromAnimValListAt(uint32_t aIndex);

  // Weak refs to our DOMSVGTransform items. The items are friends and take care
  // of clearing our pointer to them when they die.
  FallibleTArray<dom::DOMSVGTransform*> mItems;

  RefPtr<dom::DOMSVGAnimatedTransformList> mAList;
};

}  // namespace dom
}  // namespace mozilla

#endif  // MOZILLA_DOMSVGTRANSFORMLIST_H__
