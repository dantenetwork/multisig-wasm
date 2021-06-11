/*
 * @Description:
 * @Author: kay
 * @Date: 2021-06-01 11:00:40
 * @LastEditTime: 2021-06-11 09:58:52
 * @LastEditors: kay
 */

#include <platon/platon.hpp>

using namespace platon;

namespace dante {

static constexpr int64_t kMsecondsPerDay = 24 * 3600 * 1000ll;

struct Proposal {
  std::string contract_addr;
  std::string to;
  u128 amount;
  int64_t expiration;

  PLATON_SERIALIZE(Proposal, (contract_addr)(to)(amount)(expiration))
};

struct Manager {
  std::set<std::string> managers;
  std::set<std::string> approvers;

  // 0 delete managers, 1 add manager
  uint8_t action_type;
  uint8_t requires;

  PLATON_SERIALIZE(Manager, (managers)(approvers)(action_type)(requires))
};

CONTRACT Multisig : public platon::Contract {
 public:
  ACTION void init(const std::set<std::string>& managers,
                   const uint8_t& requires);
  CONST uint8_t get_requires();
  CONST std::set<std::string> get_managers();
  CONST Proposal get_proposal(const std::string& proposal_name);
  CONST Manager get_update_managers_proposal(const std::string& proposal_name);
  CONST std::set<std::string> get_approval(const std::string& approval_name);

  ACTION bool add_managers(const std::string& proposal_name,
                           const std::set<std::string>& new_managers,
                           const uint8_t& requires);
  ACTION bool remove_managers(const std::string& proposal_name,
                              const std::set<std::string>& old_managers,
                              const uint8_t& requires);

  ACTION bool propose(const std::string& proposal_name,
                      const std::string& contract_addr, const std::string& to,
                      const u128& amount, const int64_t& expiration);

  ACTION bool approve(const std::string& proposal_name);

  ACTION bool execute(const std::string& proposal_name);

 protected:
  PLATON_EVENT1(Propose, std::string, std::string, std::string, u128,
                int64_t);
  PLATON_EVENT1(Approve, std::string);
  PLATON_EVENT1(Execute, std::string);
  PLATON_EVENT1(AddManagers, std::string, std::set<std::string>, uint8_t);
  PLATON_EVENT1(RemoveManagers, std::string, std::set<std::string>, uint8_t);

 private:
  platon::StorageType<"managers"_n, std::set<std::string>> managers_;
  platon::StorageType<"requires"_n, uint8_t> requires_;
  platon::db::Map<"update"_n, std::string, Manager> update_managers_;
  platon::db::Map<"proposals"_n, std::string, Proposal> proposals_;
  platon::db::Map<"approvers"_n, std::string, std::set<std::string>> approvers_;
};

PLATON_DISPATCH(
    Multisig,
    (init)(propose)(approve)(execute)(get_requires)(get_managers)(get_proposal)(get_approval)(add_managers)(remove_managers)(get_update_managers_proposal))

}  // namespace dante